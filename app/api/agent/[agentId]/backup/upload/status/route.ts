import {NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db as dbClient, db} from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {getDatabaseOrThrow, withAgentCheck} from "../../helpers";
import {eventEmitter} from "@/features/shared/event";

export type Body = {
    generatedId: string
    status: "success" | "failed"
    backupStorageId: string
    path: string
    size: number
    backupId: string
}
export const PATCH = withAgentCheck(async (request: Request, {params, agent}: {
    params: Promise<{ agentId: string }>,
    agent: any
}) => {
    try {
        const body: Body = await request.json();
        const generatedId = body.generatedId;
        const status = body.status;
        const filePath = body.path;
        const fileSize = body.size;
        const backupStorageId = body.backupStorageId;
        const backupId = body.backupId;


        console.log("body", body);

        const database = await getDatabaseOrThrow(generatedId);

        const backup = await db.query.backup.findFirst({
            where: and(
                eq(drizzleDb.schemas.backup.id, backupId),
                eq(drizzleDb.schemas.backup.databaseId, database.id),
            ),
            with: {
                storages: true
            }
        });

        if (!backup) {
            return NextResponse.json(
                {error: "Unable to find the corresponding backup"},
                {status: 404}
            );
        }

        const [backupStorage] = await dbClient
            .update(drizzleDb.schemas.backupStorage)
            .set(withUpdatedAt({
                status: status,
                path: filePath,
                size: fileSize
            }))
            .where(eq(drizzleDb.schemas.backupStorage.id, backupStorageId))
            .returning();


        if (backup.storages.length > 0) {
            const hasSuccessfulStorage = backup.storages.some(
                (storage) => storage.status === "success"
            );

            if (hasSuccessfulStorage && backup.status !== "success") {
                await db
                    .update(drizzleDb.schemas.backup)
                    .set({status: "success"})
                    .where(eq(drizzleDb.schemas.backup.id, backup.id));
            }
        }

        eventEmitter.emit('modification', {update: true});


        return NextResponse.json({
                message: "Backup status successfully updated",
                backupStorage: backupStorage
            },
            {status: 200}
        );
    } catch (error) {
        console.error("Error in POST for INIT backup:", error);
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
});

