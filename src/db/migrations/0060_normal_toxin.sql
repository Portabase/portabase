DROP MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly" AS (
    SELECT
        DATE_TRUNC('day', created_at) AS period,
        SUM(file_size)                AS total_bytes,
        COUNT(*)                      AS backup_count
    FROM backups
    WHERE status = 'success'
      AND deleted_at IS NULL
      AND file_size IS NOT NULL
      AND created_at >= NOW() - INTERVAL '90 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY period ASC
);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mv_kpi_evolution_monthly_period"
    ON "mv_kpi_evolution_monthly" USING btree ("period");