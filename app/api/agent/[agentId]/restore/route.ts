import { NextResponse } from "next/server";
import * as drizzleDb from "@/db";
import { db as dbClient, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { sendNotificationsBackupRestore } from "@/features/notifications/utils/notifications.helpers";
import { logger } from "@/lib/logger";
import { withUpdatedAt } from "@/db/utils";
import { JobLogEntry } from "@/features/logs/types";
import { isUUID } from "@/utils/text";

const log = logger.child({ module: "api/agent/restore" });

export type BodyResultRestore = {
  generatedId: string;
  status: string;
  logs: JobLogEntry[];
  durationMs: number;
};
type RestorationStatus = "waiting" | "ongoing" | "failed" | "success";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const agentId = (await params).agentId;
    const body: BodyResultRestore = await request.json();

    if (!isUUID(body.generatedId)) {
      return NextResponse.json(
        { error: "generatedId is not a valid uuid" },
        { status: 500 },
      );
    }

    const agent = await db.query.agent.findFirst({
      where: and(
        eq(drizzleDb.schemas.agent.id, agentId),
        eq(drizzleDb.schemas.agent.isArchived, false),
      ),
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const database = await db.query.database.findFirst({
      where: eq(drizzleDb.schemas.database.agentDatabaseId, body.generatedId),
      with: {
        alertPolicies: true,
      },
    });

    if (!database) {
      return NextResponse.json(
        { error: "Database associated with generatedId provided not found" },
        { status: 404 },
      );
    }

    const restoration = await db.query.restoration.findFirst({
      where: and(
        eq(drizzleDb.schemas.restoration.status, "ongoing"),
        eq(drizzleDb.schemas.restoration.databaseId, database.id),
      ),
    });

    if (!restoration) {
      return NextResponse.json(
        { error: "Unable to fin the corresponding restoration" },
        { status: 404 },
      );
    }

    const [restorationUpdated] = await db
      .update(drizzleDb.schemas.restoration)
      .set(
        withUpdatedAt({
          status: body.status as RestorationStatus,
          durationMs: body.durationMs,
        }),
      )
      .where(eq(drizzleDb.schemas.restoration.id, restoration.id))
      .returning();

    const logsToInsert = body.logs.map((entry) => ({
      backupId: null,
      restorationId: restorationUpdated.id,

      loggedAt: new Date(entry.timestamp),

      entryType: entry.type,
      level: entry.level,

      message: entry.message,
      command: entry.command ?? null,
      output: entry.output ?? null,

      exitCode: entry.exit_code ?? null,
      durationMs: entry.duration_ms ?? null,
    }));

    if (logsToInsert.length > 0) {
      await dbClient.insert(drizzleDb.schemas.jobLog).values(logsToInsert);
    }

    await sendNotificationsBackupRestore(
      database,
      body.status == "failed" ? "error_restore" : "success_restore",
    );

    const response = {
      status: true,
      message: "Restoration successfully updated",
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    log.error({ error: error }, "Error in POST handler");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
