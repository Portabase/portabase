"use server";

import { db } from "@/db";
import { mvKpiStorageTreemap } from "@/db/schema/16_dashboard-views";
import { desc } from "drizzle-orm";

export type StorageTreemapRow = {
  provider: string;
  totalBytes: number;
  backupCount: number;
};

export async function getStorageTreemap(): Promise<StorageTreemapRow[]> {
  const rows = await db
    .select()
    .from(mvKpiStorageTreemap)
    .orderBy(desc(mvKpiStorageTreemap.totalBytes));
  return rows.map((r) => ({
    provider: r.provider ?? "unknown",
    totalBytes: Number(r.totalBytes ?? 0),
    backupCount: Number(r.backupCount ?? 0),
  }));
}
