import {NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db as dbClient, db} from "@/db";
import {getDatabaseOrThrow, withAgentCheck} from "./helpers";
import {Backup} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {eventEmitter} from "@/lib/event";
import {sendNotificationsBackupRestore} from "@/features/notifications/notifications.helpers";
import {EventKind} from "@/features/notifications/notifications.types";
import {logger} from "@/lib/logger";
import {JobLogEntry} from "@/features/logs/types";

const log = logger.child({module: "api/agent/backup/route"});

export type BodyPost = {
    method: "manual" | "automatic"
    generatedId: string
}

export type BodyPatch = {
    backupId: string
    status: "success" | "failed"
    size: number
    generatedId: string
    logs: JobLogEntry[]
    durationMs: number
}

export const POST = withAgentCheck(async (request: Request, {params, agent}: {
    params: Promise<{ agentId: string }>,
    agent: any
}) => {
    try {
        const body: BodyPost = await request.json();

        const method = body.method
        const database = await getDatabaseOrThrow(body.generatedId);

        let backup: Backup | null | undefined = null;

        if (method === "automatic") {

            const ongoingBackup = await db.query.backup.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backup.status, 'ongoing'),
                    eq(drizzleDb.schemas.backup.databaseId, database.id),
                ),
            });

            if (!ongoingBackup) {
                [backup] = await db
                    .insert(drizzleDb.schemas.backup)
                    .values({
                        status: 'ongoing',
                        databaseId: database.id,
                    })
                    .returning();
                if (!backup) {
                    return NextResponse.json(
                        {error: "Unable to create an automatic backup"},
                        {status: 500}
                    );
                }
            } else {
                return NextResponse.json(
                    {error: "A backup is already ongoing"},
                    {status: 500}
                );
            }
        } else {
            backup = await db.query.backup.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backup.status, 'ongoing'),
                    eq(drizzleDb.schemas.backup.databaseId, database.id),
                ),
            });

            if (!backup) {
                return NextResponse.json(
                    {error: "Unable to find the corresponding backup"},
                    {status: 404}
                );
            }
        }

        eventEmitter.emit('modification', {update: true});

        return NextResponse.json(
            {
                message: "Init backup success",
                backup: backup,
            },
            {status: 200}
        );
    } catch (error) {
        log.error({error: error}, "Error in POST for INIT backup");
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
});

export const PATCH = withAgentCheck(async (request: Request, {params, agent}: {
    params: Promise<{ agentId: string }>,
    agent: any
}) => {
    try {
        const body: BodyPatch = await request.json();

        const status = body.status
        const backupId = body.backupId
        const backupSize = body.size

        const database = await getDatabaseOrThrow(body.generatedId);

        const backup = await db.query.backup.findFirst({
            where: eq(drizzleDb.schemas.backup.id, backupId),
        });

        if (!backup) {
            return NextResponse.json(
                {error: "No backup found"},
                {status: 500}
            );
        }

        const [backupUpdated] = await dbClient
            .update(drizzleDb.schemas.backup)
            .set(withUpdatedAt({
                status: status,
                fileSize: backupSize,
                durationMs: body.durationMs
            }))
            .where(eq(drizzleDb.schemas.backup.id, backup.id))
            .returning();


        const logsToInsert = body.logs.map((entry) => ({
            backupId: backup.id,
            restorationId: null,

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
            await dbClient
                .insert(drizzleDb.schemas.jobLog)
                .values(logsToInsert);
        }


        eventEmitter.emit('modification', {update: true});
        await sendNotificationsBackupRestore(database, status == "failed" ? "error_backup" : "success_backup" as EventKind);

        return NextResponse.json(
            {
                message: "Backup successfully updated",
                backup: backupUpdated,
            },
            {status: 200}
        );
    } catch (error) {
        log.error({error: error}, "Error in PATCH backup")
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
});

