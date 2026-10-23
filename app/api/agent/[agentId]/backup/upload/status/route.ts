import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { db as dbClient, db } from "@/db";
import { withUpdatedAt } from "@/db/utils";
import { getDatabaseOrThrow, withAgentCheck } from "../../helpers";
import { eventEmitter } from "@/lib/event";
import { logger } from "@/lib/logger";
import { refreshBackupManifest } from "@/features/storages/utils/backup-manifest";
import { isSnapshotId } from "@/lib/restic/repo";
import {
  snapshotStatsSchema,
  syncStatsSchema,
  type SnapshotStats,
  type SyncStats,
} from "@/db/schema/14_storage-backup";

const log = logger.child({ module: "api/agent/backup/upload/status" });

export type Body = {
  generatedId: string;
  status: "success" | "failed";
  backupStorageId: string;
  path: string;
  size: number;
  backupId: string;
  stats?: unknown;
};

/**
 * Validated counters of a successful snapshot or sync run; invalid ones are dropped
 * (they are informative, the status must still land). A sync run gets `sizeDelta`:
 * its replica size minus the previous successful run's on the same channel.
 */
async function runStats(
  body: Body,
  engine: string,
  databaseId: string,
  storageChannelId: string | undefined,
): Promise<SnapshotStats | SyncStats | null> {
  if (body.status !== "success" || body.stats == null) return null;
  const schema = engine === "restic" ? snapshotStatsSchema : engine === "sync" ? syncStatsSchema : null;
  const parsed = schema?.safeParse(body.stats);
  if (!parsed?.success) {
    log.warn({ engine, backupStorageId: body.backupStorageId }, "ignoring invalid run stats");
    return null;
  }
  if (!("replicaBytes" in parsed.data) || !storageChannelId) return parsed.data;

  const { backup, backupStorage } = drizzleDb.schemas;
  const [previous] = await db
    .select({ stats: backupStorage.stats })
    .from(backupStorage)
    .innerJoin(backup, eq(backup.id, backupStorage.backupId))
    .where(
      and(
        eq(backup.databaseId, databaseId),
        eq(backupStorage.storageChannelId, storageChannelId),
        eq(backupStorage.engine, "sync"),
        eq(backupStorage.status, "success"),
        ne(backupStorage.id, body.backupStorageId),
      ),
    )
    .orderBy(desc(backupStorage.createdAt))
    .limit(1);
  const replica = parsed.data.replicaBytes;
  const before = previous ? (previous.stats as SyncStats | null)?.replicaBytes : 0;
  return {
    ...parsed.data,
    sizeDelta: replica != null && before != null ? replica - before : null,
  };
}

export const PATCH = withAgentCheck(
  async (
    request: Request,
    {
      params,
      agent,
    }: {
      params: Promise<{ agentId: string }>;
      agent: any;
    },
  ) => {
    try {
      const body: Body = await request.json();
      const generatedId = body.generatedId;
      const status = body.status;
      const filePath = body.path;
      const fileSize = body.size;
      const backupStorageId = body.backupStorageId;
      const backupId = body.backupId;

      const database = await getDatabaseOrThrow(generatedId, agent.id);

      // A snapshot path is later passed to restic (forget, restore payload): only a full id.
      if (database.backupEngine === "restic" && filePath && !isSnapshotId(filePath)) {
        return NextResponse.json(
          { error: "path is not a restic snapshot id" },
          { status: 400 },
        );
      }

      const backup = await db.query.backup.findFirst({
        where: and(
          eq(drizzleDb.schemas.backup.id, backupId),
          eq(drizzleDb.schemas.backup.databaseId, database.id),
        ),
        with: {
          storages: true,
        },
      });

      if (!backup) {
        return NextResponse.json(
          { error: "Unable to find the corresponding backup" },
          { status: 404 },
        );
      }

      const stats = await runStats(
        body,
        database.backupEngine,
        database.id,
        backup.storages.find((s) => s.id === backupStorageId)?.storageChannelId,
      );

      const [backupStorage] = await dbClient
        .update(drizzleDb.schemas.backupStorage)
        .set(
          withUpdatedAt({
            status: status,
            path: filePath,
            size: fileSize,
            stats,
          }),
        )
        .where(
          and(
            eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
            eq(drizzleDb.schemas.backupStorage.backupId, backup.id),
            eq(drizzleDb.schemas.backupStorage.status, "pending"),
          ),
        )
        .returning();

      if (!backupStorage) {
        // Only a pending row of this backup takes a status (prune forgets local snapshots of failed rows): a replay is a no-op, any other transition is refused.
        const current = await db.query.backupStorage.findFirst({
          where: and(
            eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
            eq(drizzleDb.schemas.backupStorage.backupId, backup.id),
          ),
        });
        if (current?.status === status) {
          return NextResponse.json(
            {
              message: "Backup status successfully updated",
              backupStorage: current,
            },
            { status: 200 },
          );
        }
        return NextResponse.json(
          { error: "Backup storage is not pending" },
          { status: 409 },
        );
      }

      // Any status change can add or remove this storage from the manifest.
      refreshBackupManifest(database.projectId, backupStorage.storageChannelId);

      if (backup.storages.length > 0) {
        const hasSuccessfulStorage = backup.storages.some(
          (storage) => storage.status === "success",
        );

        if (hasSuccessfulStorage && backup.status !== "success") {
          await db
            .update(drizzleDb.schemas.backup)
            .set(
              withUpdatedAt({
                status: "success",
                fileSize: fileSize,
              }),
            )
            .where(eq(drizzleDb.schemas.backup.id, backup.id));
        }
      }

      eventEmitter.emit("modification", { update: true });

      return NextResponse.json(
        {
          message: "Backup status successfully updated",
          backupStorage: backupStorage,
        },
        { status: 200 },
      );
    } catch (error) {
      log.error({ error: error }, "Error in POST for INIT backup");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
