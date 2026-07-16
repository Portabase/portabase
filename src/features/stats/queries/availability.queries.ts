"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, count, eq, gte, inArray, isNull } from "drizzle-orm";
import type { KpiAvailability } from "@/features/stats/types";
import {
  type DashboardScope,
  isEmptyScope,
  scopedAgentIds,
  scopedDatabaseIds,
} from "@/features/stats/queries/scope.queries";

const EMPTY: KpiAvailability = { total: 0, upCount: 0, availabilityPct: 0 };

export async function getDatabasesAvailability(
  scope: DashboardScope,
): Promise<KpiAvailability> {
  if (isEmptyScope(scope)) return EMPTY;

  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const db_ = drizzleDb.schemas.database;
  const baseWhere = and(
    isNull(db_.deletedAt),
    scope ? inArray(db_.id, scopedDatabaseIds(scope)) : undefined,
  );

  const [[totalRow], [upRow]] = await Promise.all([
    db.select({ total: count() }).from(db_).where(baseWhere),
    db.select({ upCount: count() }).from(db_).where(
      and(baseWhere, gte(db_.lastContact, tenMinsAgo))
    ),
  ]);

  const total = totalRow.total;
  const upCount = upRow.upCount;
  return {
    total,
    upCount,
    availabilityPct: total === 0 ? 0 : Number(((upCount / total) * 100).toFixed(1)),
  };
}

export async function getAgentsAvailability(
  scope: DashboardScope,
): Promise<KpiAvailability> {
  if (isEmptyScope(scope)) return EMPTY;

  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const ag = drizzleDb.schemas.agent;
  const baseWhere = and(
    eq(ag.isArchived, false),
    isNull(ag.deletedAt),
    scope ? inArray(ag.id, scopedAgentIds(scope)) : undefined,
  );

  const [[totalRow], [upRow]] = await Promise.all([
    db.select({ total: count() }).from(ag).where(baseWhere),
    db.select({ upCount: count() }).from(ag).where(
      and(baseWhere, gte(ag.lastContact, tenMinsAgo))
    ),
  ]);

  const total = totalRow.total;
  const upCount = upRow.upCount;
  return {
    total,
    upCount,
    availabilityPct: total === 0 ? 0 : Number(((upCount / total) * 100).toFixed(1)),
  };
}
