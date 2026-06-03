"use server";

import { db } from "@/db";
import { mvKpiDbmsTreemap } from "@/db/schema/16_dashboard-views";
import { desc } from "drizzle-orm";

export type DbmsTreemapRow = {
  dbms: string;
  totalBytes: number;
  databaseCount: number;
  backupCount: number;
};

export async function getDbmsTreemap(): Promise<DbmsTreemapRow[]> {
  const rows = await db
    .select()
    .from(mvKpiDbmsTreemap)
    .orderBy(desc(mvKpiDbmsTreemap.totalBytes));
  return rows.map((r) => ({
    dbms: r.dbms ?? "unknown",
    totalBytes: Number(r.totalBytes ?? 0),
    databaseCount: Number(r.databaseCount ?? 0),
    backupCount: Number(r.backupCount ?? 0),
  }));
}
