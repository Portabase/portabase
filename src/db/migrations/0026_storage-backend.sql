-- Custom SQL Migration: Create Storage Channel and Populate Backup Storage
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


 -- Add column
ALTER TABLE public.restorations
    ADD COLUMN backup_storage_id uuid;

-- Add foreign key
ALTER TABLE public.restorations
    ADD CONSTRAINT restorations_backup_storage_id_fk
        FOREIGN KEY (backup_storage_id)
            REFERENCES public.backup_storage(id)
            ON DELETE CASCADE
            ON UPDATE NO ACTION;


DO $$
    DECLARE
        s RECORD;
        channel_id UUID;
        existing_local RECORD;
        p RECORD;
        d RECORD;
        b RECORD;
    BEGIN
        -- Get current settings (assume single row)
        SELECT * INTO s FROM settings LIMIT 1;

        -- Create S3 or Local storage channel
        IF s.storage = 's3' THEN
            BEGIN
                INSERT INTO storage_channel (
                    id, organization_id, provider, name, config, enabled, created_at, updated_at
                )
                VALUES (
                           gen_random_uuid(),
                           NULL,
                           's3',
                           'Default S3 Channel',
                           jsonb_build_object(
                                   'endPointUrl', s.s3_endpoint_url,
                                   'accessKey', s.s3_access_key_id,
                                   'secretKey', s.s3_secret_access_key,
                                   'bucketName', s.s3_bucket_name
                           ),
                           true,
                           NOW(),
                           NOW()
                       )
                RETURNING id INTO channel_id;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create S3 storage_channel: %', SQLERRM;
                -- Try to fallback to existing S3 channel
                SELECT id INTO channel_id FROM storage_channel WHERE provider = 's3' LIMIT 1;
            END;
        ELSE
            SELECT * INTO existing_local
            FROM storage_channel
            WHERE provider = 'local'
            LIMIT 1;

            IF existing_local IS NULL THEN
                INSERT INTO storage_channel (
                    id, organization_id, provider, name, config, enabled, created_at, updated_at
                )
                VALUES (
                           gen_random_uuid(),
                           NULL,
                           'local',
                           'System',
                           '{}'::jsonb,
                           true,
                           NOW(),
                           NOW()
                       )
                RETURNING id INTO channel_id;
            ELSE
                UPDATE storage_channel
                SET name = 'System',
                    config = '{}'::jsonb,
                    enabled = true,
                    updated_at = NOW()
                WHERE id = existing_local.id
                RETURNING id INTO channel_id;
            END IF;
        END IF;

        -- Safety check
        IF channel_id IS NULL THEN
            RAISE EXCEPTION 'channel_id is NULL. Cannot proceed with backup_storage inserts.';
        END IF;

        -- Update settings with default storage channel
        UPDATE settings
        SET default_storage_channel_id = channel_id
        WHERE id = s.id;

        -- Loop over projects -> databases -> backups
        FOR p IN SELECT id, slug FROM projects LOOP
                RAISE NOTICE 'Processing project: %', p.slug;

                FOR d IN SELECT id FROM databases WHERE project_id = p.id LOOP
                        RAISE NOTICE ' Database ID: %', d.id;

                        FOR b IN SELECT id, file AS file_name, file_size FROM backups WHERE database_id = d.id LOOP
                                RAISE NOTICE '  Backup: %', b.file_name;
                                BEGIN
                                    INSERT INTO backup_storage (
                                        id,
                                        backup_id,
                                        storage_channel_id,
                                        status,
                                        path,
                                        size,
                                        checksum,
                                        created_at,
                                        updated_at
                                    )
                                    VALUES (
                                               gen_random_uuid(),
                                               b.id,
                                               channel_id,
                                               'success',
                                               format('backups/%s/%s', p.slug, b.file_name),
                                               b.file_size,
                                               NULL,
                                               NOW(),
                                               NOW()
                                           );
                                EXCEPTION WHEN OTHERS THEN
                                    RAISE NOTICE 'Failed to insert backup_storage for backup %: %', b.id, SQLERRM;
                                END;
                            END LOOP;
                    END LOOP;
            END LOOP;

    END $$;
