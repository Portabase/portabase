DROP MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."mv_kpi_evolution_monthly" AS (
    SELECT
        DATE_TRUNC('day', created_at) AS period,
        COALESCE(
            SUM(file_size) FILTER (
                WHERE status = 'success' AND deleted_at IS NULL AND file_size IS NOT NULL
            ), 0
        )                                          AS total_bytes,
        COUNT(*) FILTER (WHERE status = 'success') AS success_count,
        COUNT(*) FILTER (WHERE status = 'failed')  AS failed_count
    FROM backups
    WHERE status IN ('success', 'failed')
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY period ASC
);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mv_kpi_evolution_monthly_period" ON "mv_kpi_evolution_monthly" USING btree ("period");