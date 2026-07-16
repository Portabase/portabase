import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { withUpdatedAt } from "@/db/utils";
import type { StorageInput } from "@/features/storages/types";
import { dispatchStorage } from "@/features/storages/utils/storages.dispatch";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "tasks/database/backup-delete" });

export type DeleteBackupResult = {
  ok: boolean;
  error?: string;
  storageFailures: number;
};

export async function deleteBackupService(
  backupId: string,
  databaseId: string,
): Promise<DeleteBackupResult> {
  const backup = await db.query.backup.findFirst({
    where: and(
      eq(drizzleDb.schemas.backup.id, backupId),
      eq(drizzleDb.schemas.backup.databaseId, databaseId),
    ),
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

  for (const backupStorage of backupStorages) {
    await db
      .update(drizzleDb.schemas.backupStorage)
      .set(withUpdatedAt({ deletedAt: new Date() }))
      .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

    if (backupStorage.status !== "success" || !backupStorage.path) {
      continue;
    }

    const input: StorageInput = {
      action: "delete",
      data: {
        path: backupStorage.path,
      },
    };

    try {
      const result = await dispatchStorage(
        input,
        undefined,
        backupStorage.storageChannelId,
      );

      if (!result.success) {
        storageFailures++;
        log.error(
          {
            name: "deleteBackupService",
            backupId,
            databaseId,
            path: backupStorage.path,
            provider: result.provider,
            cause: result.error,
          },
          "Storage refused to delete a backup file",
        );
      }
    } catch (error) {
      storageFailures++;
      log.error(
        {
          name: "deleteBackupService",
          backupId,
          databaseId,
          path: backupStorage.path,
          error,
        },
        "Storage delete threw",
      );
    }
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

  return { ok: true, storageFailures };
}
