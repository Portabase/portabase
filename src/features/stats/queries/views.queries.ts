"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function refreshDashboardViews(): Promise<void> {
  // CONCURRENTLY requires a unique index on the view — not present in current migration.
  // Use regular REFRESH until unique indexes are added.
  await db.execute(sql`REFRESH MATERIALIZED VIEW mv_kpi_backup_counts`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW mv_kpi_evolution_monthly`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW mv_kpi_storage_treemap`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW mv_kpi_dbms_treemap`);
}
