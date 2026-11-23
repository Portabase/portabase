import {NextResponse} from "next/server";
import {and, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db as dbClient, db} from "@/db";
import {getDatabaseOrThrow, withAgentCheck} from "./helpers";
import {Backup} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {eventEmitter} from "@/lib/event";
import {sendNotificationsBackupRestore} from "@/features/notifications/utils/notifications.helpers";
import {EventKind} from "@/features/notifications/types";
import {logger} from "@/lib/logger";
import {JobLogEntry} from "@/features/logs/types";
import {fullBackupReason, parentOffer} from "@/features/database/services/physical-chain.service";
import {deleteBackupStorageObject} from "@/lib/tasks/database/utils/backup-delete.service";

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
    parentBackupId?: string | null
    manifest?: string
}

export const POST = withAgentCheck(async (request: Request, {params, agent}: {
    params: Promise<{ agentId: string }>,
    agent: any
}) => {
    try {
        const body: BodyPost = await request.json();

        const method = body.method
        const database = await getDatabaseOrThrow(body.generatedId, agent.id);

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

        let parent: Awaited<ReturnType<typeof parentOffer>> | undefined;
        if (database.backupEngine === "physical") {
            const fullReason = await fullBackupReason(database, backup);
            parent = fullReason ? null : await parentOffer(database);
            if (fullReason) {
                await db.insert(drizzleDb.schemas.jobLog).values({
                    backupId: backup.id,
                    restorationId: null,
                    loggedAt: new Date(),
                    entryType: "log",
                    level: "info",
                    message: `Full backup: ${fullReason}`,
                    command: null,
                    output: null,
                    exitCode: null,
                    durationMs: null,
                });
            }
            [backup] = await db
                .update(drizzleDb.schemas.backup)
                .set(withUpdatedAt({parentBackupId: parent?.backupId ?? null}))
                .where(eq(drizzleDb.schemas.backup.id, backup.id))
                .returning();
        }

        eventEmitter.emit('modification', {update: true});

        return NextResponse.json(
            {
                message: "Init backup success",
                backup: backup,
                ...(parent !== undefined && {parent}),
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

        const database = await getDatabaseOrThrow(body.generatedId, agent.id);

        const backup = await db.query.backup.findFirst({
            where: and(
                eq(drizzleDb.schemas.backup.id, backupId),
                eq(drizzleDb.schemas.backup.databaseId, database.id),
            ),
        });

        if (!backup) {
            return NextResponse.json(
                {error: "No backup found"},
                {status: 500}
            );
        }

        let finalStatus = status;
        let rejection: string | null = null;
        let physicalFields: {parentBackupId: string | null} | null = null;
        let acceptedManifest: string | null = null;

        if (database.backupEngine === "physical") {
            if (status === "success") {
                const reportedParentId = body.parentBackupId ?? null;
                if (backup.deletedAt !== null) {
                    rejection = "the backup has been deleted";
                } else if (!body.manifest) {
                    rejection = "the manifest is missing";
                } else if (reportedParentId !== null && reportedParentId !== backup.parentBackupId) {
                    rejection = "the parent backup is not the one offered";
                } else if (reportedParentId !== null) {
                    const reportedParent = await db.query.backup.findFirst({
                        where: eq(drizzleDb.schemas.backup.id, reportedParentId),
                    });
                    if (!reportedParent || reportedParent.deletedAt !== null) {
                        rejection = "the parent backup has been deleted";
                    }
                }
                if (rejection === null) {
                    physicalFields = {parentBackupId: reportedParentId};
                    acceptedManifest = body.manifest ?? null;
                }
            }
            if (rejection !== null) finalStatus = "failed";
            physicalFields ??= {parentBackupId: null};
        }

        const [backupUpdated] = await dbClient
            .update(drizzleDb.schemas.backup)
            .set(withUpdatedAt({
                status: finalStatus,
                fileSize: backupSize,
                durationMs: body.durationMs,
                ...physicalFields,
            }))
            .where(eq(drizzleDb.schemas.backup.id, backup.id))
            .returning();

        if (acceptedManifest !== null) {
            await dbClient
                .insert(drizzleDb.schemas.backupManifest)
                .values({backupId: backup.id, manifest: acceptedManifest})
                .onConflictDoUpdate({target: drizzleDb.schemas.backupManifest.backupId, set: {manifest: acceptedManifest}});
        }

        if (rejection !== null || backup.deletedAt !== null) {
            const liveStorages = await db.query.backupStorage.findMany({
                where: and(
                    eq(drizzleDb.schemas.backupStorage.backupId, backup.id),
                    isNull(drizzleDb.schemas.backupStorage.deletedAt),
                ),
            });
            for (const liveStorage of liveStorages) {
                await deleteBackupStorageObject(liveStorage, database.agentDatabaseId);
            }
        }

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

        if (rejection !== null) {
            logsToInsert.push({
                backupId: backup.id,
                restorationId: null,
                loggedAt: new Date(),
                entryType: "log",
                level: "error",
                message: `Physical backup rejected: ${rejection}`,
                command: null,
                output: null,
                exitCode: null,
                durationMs: null,
            });
        }

        if (logsToInsert.length > 0) {
            await dbClient
                .insert(drizzleDb.schemas.jobLog)
                .values(logsToInsert);
        }


        eventEmitter.emit('modification', {update: true});
        await sendNotificationsBackupRestore(database, finalStatus == "failed" ? "error_backup" : "success_backup" as EventKind);

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
