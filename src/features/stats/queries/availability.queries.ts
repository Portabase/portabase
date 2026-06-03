"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, count, eq, gte, isNull } from "drizzle-orm";
import type { KpiAvailability } from "@/features/stats/types";

export async function getDatabasesAvailability(): Promise<KpiAvailability> {
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const db_ = drizzleDb.schemas.database;
  const baseWhere = isNull(db_.deletedAt);

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

export async function getAgentsAvailability(): Promise<KpiAvailability> {
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const ag = drizzleDb.schemas.agent;
  const baseWhere = and(eq(ag.isArchived, false), isNull(ag.deletedAt));

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
