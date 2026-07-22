DROP MATERIALIZED VIEW "public"."mv_kpi_storage_treemap";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_storage_treemap" AS (
    SELECT
        sc.id         AS channel_id,
        sc.name       AS channel_name,
        sc.provider,
        SUM(bs.size)  AS total_bytes,
        COUNT(bs.id)  AS backup_count
    FROM backup_storage bs
    JOIN storage_channel sc ON sc.id = bs.storage_channel_id
    JOIN backups b ON b.id = bs.backup_id
    WHERE bs.status = 'success' AND bs.size IS NOT NULL AND b.deleted_at IS NULL
    GROUP BY sc.id, sc.name, sc.provider
    ORDER BY total_bytes DESC
);