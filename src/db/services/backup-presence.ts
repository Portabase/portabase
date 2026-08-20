import "server-only";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import pLimit from "p-limit";
import { dispatchViaProvider } from "@/features/channel/components/storages";
import { StorageProviderKind } from "@/features/storages/types";
import {
  classifyCheckResult,
  foldPresence,
} from "@/features/database/utils/backup-presence.logic";
import { dispatchNotification } from "@/features/notifications/utils/notifications.dispatch";
import { resolveAlertPolicies } from "@/features/database/utils/policy-resolution";
import { EventPayload, EventKind } from "@/features/notifications/types";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "tasks/backup-presence" });


const activeBackupIds = db
  .select({ id: drizzleDb.schemas.backup.id })
  .from(drizzleDb.schemas.backup)
  .innerJoin(
    drizzleDb.schemas.database,
    eq(drizzleDb.schemas.database.id, drizzleDb.schemas.backup.databaseId),
  )
  .where(
    and(
      isNotNull(drizzleDb.schemas.database.projectId),
      isNull(drizzleDb.schemas.backup.deletedAt),
      isNull(drizzleDb.schemas.database.deletedAt),
    ),
  );

const eligibleForPresenceCheck = inArray(
  drizzleDb.schemas.backupStorage.backupId,
  activeBackupIds,
);

export async function getDuePresenceRows(limit: number, staleHours: number) {
  const threshold = new Date(Date.now() - staleHours * 60 * 60 * 1000);

  const missing = await db.query.backupStorage.findMany({
    where: and(
      isNull(drizzleDb.schemas.backupStorage.deletedAt),
      eq(drizzleDb.schemas.backupStorage.status, "success"),
      eq(drizzleDb.schemas.backupStorage.presence, "missing"),
      eligibleForPresenceCheck,
    ),
    with: { storageChannel: true, backup: true },
    orderBy: sql`${drizzleDb.schemas.backupStorage.lastCheckedAt} asc nulls first`,
  });

  const stale = await db.query.backupStorage.findMany({
    where: and(
      isNull(drizzleDb.schemas.backupStorage.deletedAt),
      eq(drizzleDb.schemas.backupStorage.status, "success"),
      ne(drizzleDb.schemas.backupStorage.presence, "missing"),
      or(
        isNull(drizzleDb.schemas.backupStorage.lastCheckedAt),
        lt(drizzleDb.schemas.backupStorage.lastCheckedAt, threshold),
      ),
      eligibleForPresenceCheck,
    ),
    with: { storageChannel: true, backup: true },
    orderBy: sql`${drizzleDb.schemas.backupStorage.lastCheckedAt} asc nulls first`,
    limit,
  });

  return [...missing, ...stale];
}

type DueRow = Awaited<ReturnType<typeof getDuePresenceRows>>[number];

async function applyPresence(
  row: DueRow,
  outcome: "present" | "missing" | "error",
  now: Date,
  errorMessage?: string,
) {
  const { update, flip } = foldPresence(
    { presence: row.presence },
    outcome,
    now,
    errorMessage,
  );
  await db
    .update(drizzleDb.schemas.backupStorage)
    .set(update)
    .where(eq(drizzleDb.schemas.backupStorage.id, row.id));
  return { row, flip };
}

async function checkOnePresence(row: DueRow, now: Date) {
  if (!row.storageChannel) {
    return applyPresence(row, "error", now, "Storage channel missing");
  }
  if (!row.path) {
    return applyPresence(row, "error", now, "No path recorded for backup file");
  }
  const result = await dispatchViaProvider(
    row.storageChannel.provider as StorageProviderKind,
    row.storageChannel.config,
    { action: "check", data: { path: row.path } },
  );
  const outcome = classifyCheckResult(result);
  return applyPresence(row, outcome, now, result.error);
}

async function notifyPresenceFlip(row: DueRow, flip: "to_missing" | "to_present") {
  const databaseId = row.backup?.databaseId;
  if (!databaseId) return;

  const event: EventKind =
    flip === "to_missing" ? "error_backup_missing" : "success_backup_recovered";
  const channelName = row.storageChannel?.name ?? "storage";

  const database = await db.query.database.findFirst({
    where: eq(drizzleDb.schemas.database.id, databaseId),
    with: {
      alertPolicies: true,
      project: { with: { alertPolicies: true, organization: true } },
    },
  });

  const databaseName = database?.name ?? "unknown";
  const projectName = database?.project?.name ?? "unknown";
  const organizationName = database?.project?.organization?.name ?? "unknown";
  const context = `database "${databaseName}", project "${projectName}", organization "${organizationName}"`;

  const settings = await db.query.setting.findFirst({
    where: eq(drizzleDb.schemas.setting.name, "system"),
    with: { notificationChannel: true },
  });

  const defaultChannelEvents: EventKind[] = ["error_backup_missing"];
  const defaultPolicy = settings?.notificationChannel
    ? [
        {
          id: null as string | null,
          notificationChannelId: settings.notificationChannel.id,
          enabled: settings.notificationChannel.enabled,
          eventKinds: defaultChannelEvents,
        },
      ]
    : [];

  const resolved = database ? resolveAlertPolicies(database) : [];
  const policiesToUse =
    resolved.length > 0
      ? resolved.filter((p) => p.enabled && p.eventKinds.includes(event))
      : defaultPolicy.filter((p) => p.eventKinds.includes(event));

  if (!policiesToUse || policiesToUse.length === 0) return;

  const payload: EventPayload =
    flip === "to_missing"
      ? {
          title: "Backup file missing",
          message: `Backup ${row.backupId} not found on ${channelName} (${context})`,
          level: "critical",
          event,
          data: {
            backupId: row.backupId,
            storageChannelId: row.storageChannelId,
            path: row.path,
            databaseName,
            projectName,
            organizationName,
          },
        }
      : {
          title: "Backup file recovered",
          message: `Backup ${row.backupId} is present again on ${channelName} (${context})`,
          level: "info",
          event,
          data: {
            backupId: row.backupId,
            storageChannelId: row.storageChannelId,
            path: row.path,
            databaseName,
            projectName,
            organizationName,
          },
        };

  await Promise.all(
    policiesToUse.map((p) =>
      dispatchNotification(
        payload,
        p.id == null ? undefined : p.id,
        p.id ? undefined : p.notificationChannelId,
        undefined,
      ),
    ),
  );
}

export async function checkBackupPresenceTask(opts: {
  batchSize: number;
  staleHours: number;
  concurrency: number;
}) {
  const rows = await getDuePresenceRows(opts.batchSize, opts.staleHours);
  if (rows.length === 0) return { checked: 0, flips: 0 };

  const now = new Date();
  const limit = pLimit(opts.concurrency);
  const results = await Promise.all(
    rows.map((row) =>
      limit(async () => {
        try {
          return await checkOnePresence(row, now);
        } catch (err) {
          log.error({ err, backupStorageId: row.id }, "presence check row failed");
          return { row, flip: null };
        }
      }),
    ),
  );

  const flipped = results.filter((r) => r.flip !== null);
  for (const { row, flip } of flipped) {
    await notifyPresenceFlip(row, flip!);
  }

  log.info(
    { checked: rows.length, flips: flipped.length },
    "Backup presence check done",
  );
  return { checked: rows.length, flips: flipped.length };
}
