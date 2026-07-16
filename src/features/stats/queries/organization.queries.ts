"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { count, isNull } from "drizzle-orm";
import type { DashboardScope } from "@/features/stats/queries/scope.queries";

export async function getOrganizationCount(
  scope: DashboardScope,
): Promise<number> {

  if (scope) return scope.length;

  const org = drizzleDb.schemas.organization;

  const [row] = await db
    .select({ total: count() })
    .from(org)
    .where(isNull(org.deletedAt));

  return row.total;
}
