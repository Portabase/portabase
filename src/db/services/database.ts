"use server";
import { db } from "@/db";
import { DatabaseWith } from "@/db/schema/07_database";
import { AgentWith } from "@/db/schema/08_agent";
import type {
  OnboardingDbSettings,
  EventKind,
} from "@/features/onboarding/types";
import {
  resolveStoragePolicies,
  resolveAlertPolicies,
  resolveRetentionPolicy,
  resolveBackupCron,
} from "@/features/database/utils/policy-resolution";

export async function getOrganizationAvailableDatabases(
  organizationId: string,
  projectId?: string,
) {
  const availableDatabases = (await db.query.database.findMany({
    where: (db, { eq, or, and, isNull }) =>
      and(
        projectId
          ? or(isNull(db.projectId), eq(db.projectId, projectId))
          : isNull(db.projectId),
        isNull(db.deletedAt),
      ),
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

  const dbs = (await db.query.database.findMany({
    where: (d, { inArray }) => inArray(d.id, databaseIds),
    with: {
      retentionPolicy: true,
      alertPolicies: true,
      storagePolicies: true,
      project: {
        with: {
          retentionPolicy: true,
          alertPolicies: true,
          storagePolicies: true,
        },
      },
    },
  })) as DatabaseWith[];

  const result: Record<string, OnboardingDbSettings> = {};

  for (const dbRow of dbs) {
    const settings: OnboardingDbSettings = {};

    const rp = resolveRetentionPolicy(dbRow);
    if (rp) {
      settings.retention = {
        type: rp.type,
        count: rp.count ?? 7,
        days: rp.days ?? 30,
        gfs: {
          hourly: rp.gfsHourly ?? 0,
          daily: rp.gfsDaily ?? 7,
          weekly: rp.gfsWeekly ?? 4,
          monthly: rp.gfsMonthly ?? 12,
          yearly: rp.gfsYearly ?? 3,
        },
      };
    }

    const cron = resolveBackupCron(dbRow);
    settings.backupMethod = cron ? "automatic" : "manual";
    if (cron) settings.backupCron = cron;

    const alerts = resolveAlertPolicies(dbRow);
    if (alerts.length > 0) {
      settings.notificationPolicies = alerts.map((a) => ({
        channelId: a.notificationChannelId,
        eventKinds: a.eventKinds as EventKind[],
        enabled: a.enabled,
      }));
    }

    const storages = resolveStoragePolicies(dbRow);
    if (storages.length > 0) {
      settings.storagePolicies = storages.map((s) => ({
        channelId: s.storageChannelId,
        enabled: s.enabled,
      }));
    }

    result[dbRow.id] = settings;
  }

  return result;
}
