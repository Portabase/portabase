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
CREATE MATERIALIZED VIEW "public"."mv_kpi_dbms_treemap" AS (select "databases"."dbms", sum("backups"."file_size") as "total_bytes", count(distinct "databases"."id") as "database_count", count("backups"."id") as "backup_count" from "backups" inner join "databases" on "databases"."id" = "backups"."database_id" where ("backups"."status" = 'success' and "backups"."deleted_at" is null and "backups"."file_size" is not null) group by "databases"."dbms" order by "total_bytes" desc);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly" AS (select DATE_TRUNC('month', "created_at") as "period", sum("file_size") as "total_bytes", count(*) as "backup_count" from "backups" where ("backups"."status" = 'success' and "backups"."deleted_at" is null and "backups"."file_size" is not null) group by DATE_TRUNC('month', "backups"."created_at") order by DATE_TRUNC('month', "backups"."created_at") asc);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_storage_treemap" AS (select "storage_channel"."provider", sum("backup_storage"."size") as "total_bytes", count("backup_storage"."id") as "backup_count" from "backup_storage" inner join "storage_channel" on "storage_channel"."id" = "backup_storage"."storage_channel_id" where ("backup_storage"."status" = 'success' and "backup_storage"."size" is not null) group by "storage_channel"."provider" order by "total_bytes" desc);