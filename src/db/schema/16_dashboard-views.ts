import {
  pgMaterializedView,
  bigint,
  numeric,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const mvKpiBackupCounts = pgMaterializedView("mv_kpi_backup_counts", {
  availableCount: bigint("available_count", { mode: "number" }),
  totalDone: bigint("total_done", { mode: "number" }),
  possessionRatePct: numeric("possession_rate_pct"),
  singleton: integer("singleton"),
}).as(sql`
    SELECT
        COUNT(*) FILTER (WHERE status = 'success' AND deleted_at IS NULL)   AS available_count,
        COUNT(*) FILTER (WHERE status IN ('success', 'failed'))              AS total_done,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'success' AND deleted_at IS NULL)::numeric
            / NULLIF(COUNT(*) FILTER (WHERE status IN ('success', 'failed')), 0) * 100, 1
        )                                                                    AS possession_rate_pct,
        1                                                                    AS singleton
    FROM backups
`);

export const mvKpiEvolutionMonthly = pgMaterializedView(
  "mv_kpi_evolution_monthly",
  {
    period: timestamp("period"),
    totalBytes: bigint("total_bytes", { mode: "number" }),
    successCount: bigint("success_count", { mode: "number" }),
    failedCount: bigint("failed_count", { mode: "number" }),
  },
).as(sql`
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
`);

export const mvKpiStorageTreemap = pgMaterializedView(
  "mv_kpi_storage_treemap",
  {
    provider: text("provider"),
    totalBytes: bigint("total_bytes", { mode: "number" }),
    backupCount: bigint("backup_count", { mode: "number" }),
  },
).as(sql`
    SELECT
        sc.provider,
        SUM(bs.size)  AS total_bytes,
        COUNT(bs.id)  AS backup_count
    FROM backup_storage bs
    JOIN storage_channel sc ON sc.id = bs.storage_channel_id
    WHERE bs.status = 'success' AND bs.size IS NOT NULL
    GROUP BY sc.provider
    ORDER BY total_bytes DESC
`);

export const mvKpiDbmsTreemap = pgMaterializedView("mv_kpi_dbms_treemap", {
  dbms: text("dbms"),
  totalBytes: bigint("total_bytes", { mode: "number" }),
  databaseCount: bigint("database_count", { mode: "number" }),
  backupCount: bigint("backup_count", { mode: "number" }),
}).as(sql`
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
`);
