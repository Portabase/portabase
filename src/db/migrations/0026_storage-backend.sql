-- Custom SQL migration file, put your code below! --
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
    DECLARE
        s RECORD;
        channel_id UUID;
        existing_local RECORD;
        b RECORD;
    BEGIN
        -- Get the current settings (assume single row)
        SELECT * INTO s FROM settings LIMIT 1;

        IF s.storage = 's3' THEN
            -- Create a new S3 storage_channel
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

        ELSE
            -- local storage: check if a local channel exists
            SELECT * INTO existing_local
            FROM storage_channel
            WHERE provider = 'local'
            LIMIT 1;

            IF existing_local IS NULL THEN
                -- Create local channel
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
                -- Update existing local channel
                UPDATE storage_channel
                SET name = 'System',
                    config = '{}'::jsonb,
                    enabled = true,
                    updated_at = NOW()
                WHERE id = existing_local.id
                RETURNING id INTO channel_id;
            END IF;
        END IF;

        -- **Update settings.default_storage_channel_id for BOTH s3 and local**
        UPDATE settings
        SET default_storage_channel_id = channel_id
        WHERE id = s.id;

        -- For all backups, create backup_storage entries
        FOR b IN SELECT * FROM backups LOOP
                INSERT INTO backup_storage (
                    id, backup_id, storage_channel_id, status, path, size, checksum, created_at, updated_at
                )
                VALUES (
                           gen_random_uuid(),
                           b.id,
                           channel_id,
                           'success',
                           b.file,
                           b.file_size,
                           NULL,
                           NOW(),
                           NOW()
                       );
            END LOOP;
    END $$;
