"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, count, gte, inArray } from "drizzle-orm";
import {
  type DashboardScope,
  isEmptyScope,
} from "@/features/stats/queries/scope.queries";
import { EventKind } from "@/features/notifications/types";

const CRITICAL_EVENTS: EventKind[] = [
  "error_backup",
  "error_restore",
  "error_health_agent",
  "error_health_database",
];

export async function getCriticalAlerts24h(
  scope: DashboardScope,
): Promise<{ total: number }> {
  if (isEmptyScope(scope)) return { total: 0 };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [result] = await db
    .select({ total: count() })
    .from(drizzleDb.schemas.notificationLog)
    .where(
      and(
        gte(drizzleDb.schemas.notificationLog.sentAt, since),
        inArray(drizzleDb.schemas.notificationLog.event, CRITICAL_EVENTS),
        scope
          ? inArray(drizzleDb.schemas.notificationLog.organizationId, scope)
          : undefined,
      )
    );
  return { total: result.total };
}

export async function getTotalNotifications24h(
  scope: DashboardScope,
): Promise<{ total: number }> {
  if (isEmptyScope(scope)) return { total: 0 };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [result] = await db
    .select({ total: count() })
    .from(drizzleDb.schemas.notificationLog)
    .where(
      and(
        gte(drizzleDb.schemas.notificationLog.sentAt, since),
        scope
          ? inArray(drizzleDb.schemas.notificationLog.organizationId, scope)
          : undefined,
      )
    );
  return { total: result.total };
}
