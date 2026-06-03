"use server";

import { db } from "@/db";
import { mvKpiBackupCounts, mvKpiEvolutionMonthly } from "@/db/schema/16_dashboard-views";
import { asc } from "drizzle-orm";

export type BackupCountsResult = {
  availableCount: number;
  totalDone: number;
  possessionRatePct: number;
};

export type EvolutionRow = {
  period: Date;
  totalBytes: number;
  backupCount: number;
};

export async function getBackupCounts(): Promise<BackupCountsResult> {
  const [row] = await db.select().from(mvKpiBackupCounts).limit(1);
  return {
    availableCount: Number(row?.availableCount ?? 0),
    totalDone: Number(row?.totalDone ?? 0),
    possessionRatePct: Number(row?.possessionRatePct ?? 0),
  };
}

export async function getBackupEvolution(): Promise<EvolutionRow[]> {
  const rows = await db
    .select()
    .from(mvKpiEvolutionMonthly)
    .orderBy(asc(mvKpiEvolutionMonthly.period));
  return rows.map((r) => ({
    period: r.period!,
    totalBytes: Number(r.totalBytes ?? 0),
    backupCount: Number(r.backupCount ?? 0),
  }));
}
