import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { db } from "@/db";
import { getDatabaseOrThrow, withAgentCheck } from "../../helpers";
import { eventEmitter } from "@/lib/event";
import { logger } from "@/lib/logger";
import { isUUID } from "@/utils/text";
import { getDatabaseStorageChannels } from "@/features/agents/utils/status/storage-channels.helpers";
import type { BackupEngine } from "@/features/database/utils/backup-method";

const log = logger.child({ module: "api/agent/backup/upload/init" });

export type Body = {
  generatedId: string;
  storageChannelId: string;
  backupId: string;
  engine?: BackupEngine;
};
export const POST = withAgentCheck(
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

      log.info({ data: body }, "Body for backup upload init");

      const generatedId = body.generatedId;
      const storageChannelId = body.storageChannelId;
      const backupId = body.backupId;

      if (!generatedId || !isUUID(generatedId)) {
        return NextResponse.json(
          { error: "generatedId is not a valid UUID" },
          { status: 400 },
        );
      }

      const database = await getDatabaseOrThrow(generatedId, agent.id);

      const engine = body.engine ?? "archive";
      if (engine !== database.backupEngine) {
        return NextResponse.json(
          { error: `Engine "${engine}" does not match the source's backup method "${database.backupEngine}"` },
          { status: 400 },
        );
      }

      const channels = await getDatabaseStorageChannels(database.id);
      if (!channels.some((channel) => channel.id === storageChannelId)) {
        return NextResponse.json(
          { error: "Storage channel is not assigned to this source" },
          { status: 400 },
        );
      }

      const backup = await db.query.backup.findFirst({
        where: and(
          eq(drizzleDb.schemas.backup.id, backupId),
          eq(drizzleDb.schemas.backup.databaseId, database.id),
        ),
      });

      if (!backup) {
        return NextResponse.json(
          { error: "Unable to find the corresponding backup" },
          { status: 404 },
        );
      }

      const [backupStorage] = await db
        .insert(drizzleDb.schemas.backupStorage)
        .values({
          backupId: backup.id,
          storageChannelId: storageChannelId,
          status: "pending",
          engine: database.backupEngine,
        })
        .returning();

      eventEmitter.emit("modification", { update: true });

      return NextResponse.json(
        {
          message: "Backup storage successfully created",
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
