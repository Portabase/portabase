"use server";

import { db } from "@/db";
import { count, eq, inArray, and } from "drizzle-orm";
import { project } from "@/db/schema/06_project";
import { restoration } from "@/db/schema/07_database";
import {
  type DashboardScope,
  isEmptyScope,
  scopedDatabaseIds,
} from "@/features/stats/queries/scope.queries";

export async function getProjectsCount(scope: DashboardScope): Promise<number> {
  if (isEmptyScope(scope)) return 0;

  const [row] = await db
    .select({ total: count() })
    .from(project)
    .where(
      and(
        eq(project.isArchived, false),
        scope ? inArray(project.organizationId, scope) : undefined,
      ),
    );

  return row.total;
}

export async function getRestorationsCount(
  scope: DashboardScope,
): Promise<number> {
  if (isEmptyScope(scope)) return 0;

  const [row] = await db
    .select({ total: count() })
    .from(restoration)
    .where(
      scope
        ? inArray(restoration.databaseId, scopedDatabaseIds(scope))
        : undefined,
    );

  return row.total;
}
