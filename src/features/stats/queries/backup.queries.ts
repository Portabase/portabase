"use server";

import { db } from "@/db";
import { mvKpiBackupCounts, mvKpiEvolutionMonthly } from "@/db/schema/16_dashboard-views";
import { backup } from "@/db/schema/07_database";
import { and, asc, count, inArray, sql, sum } from "drizzle-orm";
import {
  type DashboardScope,
  isEmptyScope,
  scopedDatabaseIds,
} from "@/features/stats/queries/scope.queries";

export type BackupCountsResult = {
  availableCount: number;
  totalDone: number;
  possessionRatePct: number;
};

export type EvolutionRow = {
  period: Date;
  totalBytes: number;
  successCount: number;
  failedCount: number;
};

const rate = (availableCount: number, totalDone: number) =>
  totalDone === 0
    ? 0
    : Number(((availableCount / totalDone) * 100).toFixed(1));

export async function getBackupCounts(
  scope: DashboardScope,
): Promise<BackupCountsResult> {
  if (isEmptyScope(scope)) {
    return { availableCount: 0, totalDone: 0, possessionRatePct: 0 };
  }

  if (!scope) {
    const [row] = await db.select().from(mvKpiBackupCounts).limit(1);
    return {
      availableCount: Number(row?.availableCount ?? 0),
      totalDone: Number(row?.totalDone ?? 0),
      possessionRatePct: Number(row?.possessionRatePct ?? 0),
    };
  }

  const [row] = await db
    .select({
      availableCount: count(
        sql`CASE WHEN ${backup.status} = 'success' AND ${backup.deletedAt} IS NULL THEN 1 END`,
      ),
      totalDone: count(
        sql`CASE WHEN ${backup.status} IN ('success', 'failed') THEN 1 END`,
      ),
    })
    .from(backup)
    .where(inArray(backup.databaseId, scopedDatabaseIds(scope)));

  const availableCount = row?.availableCount ?? 0;
  const totalDone = row?.totalDone ?? 0;

  return {
    availableCount,
    totalDone,
    possessionRatePct: rate(availableCount, totalDone),
  };
}

export async function getBackupEvolution(
  scope: DashboardScope,
): Promise<EvolutionRow[]> {
  if (isEmptyScope(scope)) return [];

  if (!scope) {
    const rows = await db
      .select()
      .from(mvKpiEvolutionMonthly)
      .orderBy(asc(mvKpiEvolutionMonthly.period));
    return rows.map((r) => ({
      period: r.period!,
      totalBytes: Number(r.totalBytes ?? 0),
      successCount: Number(r.successCount ?? 0),
      failedCount: Number(r.failedCount ?? 0),
    }));
  }

  const period = sql`DATE_TRUNC('day', ${backup.createdAt})`;

  const rows = await db
    .select({
      period: sql<string>`${period}`,
      totalBytes: sum(
        sql`CASE WHEN ${backup.status} = 'success' AND ${backup.deletedAt} IS NULL AND ${backup.fileSize} IS NOT NULL THEN ${backup.fileSize} END`,
      ),
      successCount: count(
        sql`CASE WHEN ${backup.status} = 'success' THEN 1 END`,
      ),
      failedCount: count(sql`CASE WHEN ${backup.status} = 'failed' THEN 1 END`),
    })
    .from(backup)
    .where(
      and(
        inArray(backup.status, ["success", "failed"]),
        inArray(backup.databaseId, scopedDatabaseIds(scope)),
      ),
    )
    .groupBy(period)
    .orderBy(asc(period));

  return rows.map((r) => ({
    period: new Date(r.period),
    totalBytes: Number(r.totalBytes ?? 0),
    successCount: r.successCount,
    failedCount: r.failedCount,
  }));
}
