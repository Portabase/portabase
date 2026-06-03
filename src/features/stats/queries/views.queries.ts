"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function refreshDashboardViews(): Promise<void> {
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_backup_counts`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_evolution_monthly`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_storage_treemap`);
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_dbms_treemap`);
}
