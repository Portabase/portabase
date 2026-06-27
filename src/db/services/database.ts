"use server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { database, retentionPolicy } from "@/db/schema/07_database";
import { alertPolicy } from "@/db/schema/10_alert-policy";
import { storagePolicy } from "@/db/schema/13_storage-policy";
import { DatabaseWith } from "@/db/schema/07_database";
import { AgentWith } from "@/db/schema/08_agent";
import type {
  OnboardingDbSettings,
  EventKind,
} from "@/features/onboarding/types";

export async function getOrganizationAvailableDatabases(
  organizationId: string,
  projectId?: string,
) {
  const availableDatabases = (await db.query.database.findMany({
    where: (db, { eq, or, isNull }) =>
      projectId
        ? or(isNull(db.projectId), eq(db.projectId, projectId))
        : isNull(db.projectId),
    with: {
      agent: {
        with: {
          organizations: true,
        },
      },
      project: true,
      backups: true,
      restorations: true,
    },
    orderBy: (db, { desc }) => [desc(db.createdAt)],
  })) as DatabaseWith[];

  return availableDatabases.filter((db) => {
    const agent = db.agent as AgentWith;
    if (agent?.isArchived) return false;
    return (
      agent?.organizationId === organizationId ||
      agent?.organizations?.some((org) => org.organizationId === organizationId)
    );
  });
}

export async function getDatabasesSettings(
  databaseIds: string[],
): Promise<Record<string, OnboardingDbSettings>> {
  if (databaseIds.length === 0) return {};

  const [retentionPolicies, dbs, alertPolicies, storagePolicies] =
    await Promise.all([
      db
        .select()
        .from(retentionPolicy)
        .where(inArray(retentionPolicy.databaseId, databaseIds)),
      db
        .select({ id: database.id, backupPolicy: database.backupPolicy })
        .from(database)
        .where(inArray(database.id, databaseIds)),
      db
        .select()
        .from(alertPolicy)
        .where(inArray(alertPolicy.databaseId, databaseIds)),
      db
        .select()
        .from(storagePolicy)
        .where(inArray(storagePolicy.databaseId, databaseIds)),
    ]);

  const result: Record<string, OnboardingDbSettings> = {};

  for (const dbId of databaseIds) {
    const rp = retentionPolicies.find((r) => r.databaseId === dbId);
    const dbRow = dbs.find((d) => d.id === dbId);
    const alerts = alertPolicies.filter((a) => a.databaseId === dbId);
    const storages = storagePolicies.filter((s) => s.databaseId === dbId);

    const settings: OnboardingDbSettings = {};

    if (rp) {
      settings.retention = {
        type: rp.type,
        count: rp.count ?? 7,
        days: rp.days ?? 30,
        gfs: {
          daily: rp.gfsDaily ?? 7,
          weekly: rp.gfsWeekly ?? 4,
          monthly: rp.gfsMonthly ?? 12,
          yearly: rp.gfsYearly ?? 3,
        },
      };
    }

    if (dbRow) {
      if (dbRow.backupPolicy) {
        settings.backupMethod = "automatic";
        settings.backupCron = dbRow.backupPolicy;
      } else {
        settings.backupMethod = "manual";
      }
    }

    if (alerts.length > 0) {
      settings.notificationPolicies = alerts.map((a) => ({
        channelId: a.notificationChannelId,
        eventKinds: a.eventKinds as EventKind[],
        enabled: a.enabled,
      }));
    }

    if (storages.length > 0) {
      settings.storagePolicies = storages.map((s) => ({
        channelId: s.storageChannelId,
        enabled: s.enabled,
      }));
    }

    result[dbId] = settings;
  }

  return result;
}
