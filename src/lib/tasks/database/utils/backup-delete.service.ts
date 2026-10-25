import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { withUpdatedAt } from "@/db/utils";
import type { BackupStorage } from "@/db/schema/14_storage-backup";
import { dispatchStorage } from "@/features/storages/utils/storages.dispatch";
import { forgetSnapshot } from "@/lib/restic";
import { logger } from "@/lib/logger";
import { refreshBackupManifestsForBackup } from "@/features/storages/utils/backup-manifest";

const log = logger.child({ module: "tasks/database/backup-delete" });

export type DeleteBackupResult = {
  ok: boolean;
  error?: string;
  storageFailures: number;
};

async function softDeleteBackupStorage(id: string) {
  await db
    .update(drizzleDb.schemas.backupStorage)
    .set(withUpdatedAt({ deletedAt: new Date() }))
    .where(eq(drizzleDb.schemas.backupStorage.id, id));
}

/**
 * Deletes what one backup_storage row points at, then soft-deletes the row.
 * archive: the row goes first; a refused file delete only leaves an orphan (logged).
 * restic: the row stays live unless `forget` succeeds, so the next retention run
 * retries it. Snapshot data is only ever removed by forget/prune, never directly.
 * sync: the row only; the replica is removed when the source is deleted.
 * `deleted: false` means the row is still live.
 */
export async function deleteBackupStorageObject(
  row: BackupStorage,
  generatedId: string | null,
): Promise<{ deleted: boolean; error?: string }> {
  if (row.engine === "sync") {
    // One replica is shared by every sync row of the source: deleting a row
    // (manually or by retention) never touches it.
    await softDeleteBackupStorage(row.id);
    return { deleted: true };
  }
  if (row.engine === "restic") {
    if (row.path) {
      if (!generatedId) {
        return { deleted: false, error: "The source has no generated id; its repository cannot be located." };
      }
      try {
        await forgetSnapshot(row.storageChannelId, generatedId, row.path);
      } catch (error) {
        const message = (error instanceof Error ? error.message : String(error)) || "restic forget failed";
        log.error(
          { name: "deleteBackupStorageObject", backupStorageId: row.id, cause: message },
          "restic forget failed; row kept for the next retention run",
        );
        return { deleted: false, error: message };
      }
    }
    await softDeleteBackupStorage(row.id);
    return { deleted: true };
  }

  await softDeleteBackupStorage(row.id);
  if (row.status !== "success" || !row.path) return { deleted: true };

  try {
    const result = await dispatchStorage(
      { action: "delete", data: { path: row.path } },
      undefined,
      row.storageChannelId,
    );
    if (result.success) return { deleted: true };
    log.error(
      { name: "deleteBackupStorageObject", path: row.path, provider: result.provider, cause: result.error },
      "Storage refused to delete a backup file",
    );
    return { deleted: true, error: result.error ?? "storage refused the delete" };
  } catch (error) {
    log.error({ name: "deleteBackupStorageObject", path: row.path, error }, "Storage delete threw");
    return { deleted: true, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteBackupService(
  backupId: string,
  databaseId: string,
): Promise<DeleteBackupResult> {
  const backup = await db.query.backup.findFirst({
    where: and(
      eq(drizzleDb.schemas.backup.id, backupId),
      eq(drizzleDb.schemas.backup.databaseId, databaseId),
    ),
    with: { database: { columns: { agentDatabaseId: true } } },
  });

  if (!backup) {
    return { ok: false, error: "Backup not found.", storageFailures: 0 };
  }

  const backupStorages = await db.query.backupStorage.findMany({
    where: and(
      eq(drizzleDb.schemas.backupStorage.backupId, backupId),
      isNull(drizzleDb.schemas.backupStorage.deletedAt),
    ),
  });

  let storageFailures = 0;
  let stillLive = false;
  let liveError: string | undefined;

  for (const backupStorage of backupStorages) {
    const result = await deleteBackupStorageObject(backupStorage, backup.database.agentDatabaseId);
    if (!result.deleted) {
      stillLive = true;
      liveError ??= result.error;
    } else if (result.error) storageFailures++;
  }

  // A live snapshot row keeps its backup live, so retention selects it again.
  if (stillLive) {
    return { ok: false, error: liveError || "A snapshot could not be removed.", storageFailures };
  }

  await db
    .update(drizzleDb.schemas.backup)
    .set(
      withUpdatedAt({
        deletedAt: new Date(),
        status: backup.status === "ongoing" ? "failed" : backup.status,
      }),
    )
    .where(
      and(
        eq(drizzleDb.schemas.backup.id, backupId),
        eq(drizzleDb.schemas.backup.databaseId, databaseId),
      ),
    );

  await refreshBackupManifestsForBackup(backupId);

  return { ok: true, storageFailures };
}
