"use server";

import { db } from "@/db";
import { mvKpiDbmsTreemap } from "@/db/schema/16_dashboard-views";
import { backup, database } from "@/db/schema/07_database";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sum,
} from "drizzle-orm";
import {
  type DashboardScope,
  isEmptyScope,
  scopedDatabaseIds,
} from "@/features/stats/queries/scope.queries";

export type DbmsTreemapRow = {
  dbms: string;
  totalBytes: number;
  databaseCount: number;
  backupCount: number;
};

export async function getDbmsTreemap(
  scope: DashboardScope,
): Promise<DbmsTreemapRow[]> {
  if (isEmptyScope(scope)) return [];

  if (!scope) {
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

  const totalBytes = sum(backup.fileSize);

  const rows = await db
    .select({
      dbms: database.dbms,
      totalBytes,
      databaseCount: countDistinct(database.id),
      backupCount: count(backup.id),
    })
    .from(backup)
    .innerJoin(database, eq(database.id, backup.databaseId))
    .where(
      and(
        eq(backup.status, "success"),
        isNull(backup.deletedAt),
        isNotNull(backup.fileSize),
        inArray(database.id, scopedDatabaseIds(scope)),
      ),
    )
    .groupBy(database.dbms)
    .orderBy(desc(totalBytes));

  return rows.map((r) => ({
    dbms: r.dbms ?? "unknown",
    totalBytes: Number(r.totalBytes ?? 0),
    databaseCount: r.databaseCount,
    backupCount: r.backupCount,
  }));
}
