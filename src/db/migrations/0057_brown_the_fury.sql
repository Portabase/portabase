CREATE INDEX "idx_backups_status_core" ON "backups" USING btree ("status","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_backups_evolution" ON "backups" USING btree ("created_at") WHERE status = 'success' AND deleted_at IS NULL AND file_size IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_databases_availability" ON "databases" USING btree ("last_contact") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_agents_availability" ON "agents" USING btree ("last_contact") WHERE is_archived = false AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_notif_log_critical_24h" ON "notification_log" USING btree ("sent_at") WHERE event IN ('error_backup', 'error_restore', 'error_health_agent', 'error_health_database');--> statement-breakpoint
CREATE INDEX "idx_backup_storage_treemap" ON "backup_storage" USING btree ("storage_channel_id") WHERE status = 'success' AND size IS NOT NULL;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_backup_counts" AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'success' AND deleted_at IS NULL)   AS available_count,
        COUNT(*) FILTER (WHERE status IN ('success', 'failed'))              AS total_done,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'success' AND deleted_at IS NULL)::numeric
            / NULLIF(COUNT(*) FILTER (WHERE status IN ('success', 'failed')), 0) * 100, 1
        )                                                                    AS possession_rate_pct,
        1                                                                    AS singleton
    FROM backups
);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_dbms_treemap" AS (
    SELECT
        db.dbms,
        SUM(b.file_size)      AS total_bytes,
        COUNT(DISTINCT db.id) AS database_count,
        COUNT(b.id)           AS backup_count
    FROM backups b
    JOIN databases db ON db.id = b.database_id
    WHERE b.status = 'success' AND b.deleted_at IS NULL AND b.file_size IS NOT NULL
    GROUP BY db.dbms
    ORDER BY total_bytes DESC
);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly" AS (
    SELECT
        DATE_TRUNC('month', created_at) AS period,
        SUM(file_size)                  AS total_bytes,
        COUNT(*)                        AS backup_count
    FROM backups
    WHERE status = 'success' AND deleted_at IS NULL AND file_size IS NOT NULL
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY period ASC
);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_storage_treemap" AS (
    SELECT
        sc.provider,
        SUM(bs.size)  AS total_bytes,
        COUNT(bs.id)  AS backup_count
    FROM backup_storage bs
    JOIN storage_channel sc ON sc.id = bs.storage_channel_id
    WHERE bs.status = 'success' AND bs.size IS NOT NULL
    GROUP BY sc.provider
    ORDER BY total_bytes DESC
);