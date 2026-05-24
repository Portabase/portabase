"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq, inArray} from "drizzle-orm";
import {dispatchStorage} from "@/features/storages/dispatch";
import {v4 as uuidv4} from "uuid";
import {getTodayISODate} from "@/utils/date-formatting";
import {withUpdatedAt} from "@/db/utils";

export const migrationAction = userAction.schema(
    z.object({
        targetDatabaseId: z.string(),
        backupIds: z.array(z.string()),
    })
).action(async ({ parsedInput }): Promise<ServerActionResult<{}>> => {

    const { targetDatabaseId, backupIds } = parsedInput;

    let hasError = false;

    try {

        const targetDatabase = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, targetDatabaseId),
            with: {
                project: true,
                retentionPolicy: true,
                alertPolicies: true,
                storagePolicies: true
            }
        });

        if (!targetDatabase) {
            return {
                success: false,
                actionError: {
                    message: "Unable to find target database",
                    status: 404,
                },
            };
        }

        const backups = await db.query.backup.findMany({
            where: inArray(drizzleDb.schemas.backup.id, backupIds),
            with: {
                database: true,
                storages: true
            }
        });

        if (backups.length !== backupIds.length) {
            return {
                success: false,
                actionError: {
                    message: "Some backups were not found",
                    status: 400,
                },
            };
        }

        await Promise.all(
            backups.map(async (backup) => {

                const [migratedBackup] = await db
                    .insert(drizzleDb.schemas.backup)
                    .values({
                        status: "ongoing",
                        databaseId: targetDatabaseId,
                        fileSize: backup.fileSize,
                        migrated: true,
                    })
                    .returning();

                const storageResults = await Promise.allSettled(
                    backup.storages.map(async (storage) => {

                        const [backupStorage] = await db
                            .insert(drizzleDb.schemas.backupStorage)
                            .values({
                                backupId: migratedBackup.id,
                                storageChannelId: storage.storageChannelId,
                                status: "pending",
                            })
                            .returning();

                        const fileName = `${uuidv4()}.tar.gz`;
                        const pathTo = `backups/${getTodayISODate()}/${fileName}`;

                        try {
                            const result = await dispatchStorage(
                                {
                                    action: "copy",
                                    data: {
                                        from: storage.path ?? "",
                                        to: pathTo,
                                    },
                                    metadata: {
                                        storageId: storage.storageChannelId,
                                        fileKind: "backups",
                                    },
                                },
                                undefined,
                                storage.storageChannelId
                            );

                            if (!result.success) {
                                hasError = true;
                                throw new Error("dispatchStorage failed");
                            }

                            await db
                                .update(drizzleDb.schemas.backupStorage)
                                .set(
                                    withUpdatedAt({
                                        status: "success",
                                        path: pathTo,
                                        size: backup.fileSize,
                                    })
                                )
                                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

                            return { success: true };

                        } catch (error) {

                            hasError = true;

                            await db
                                .update(drizzleDb.schemas.backupStorage)
                                .set(
                                    withUpdatedAt({
                                        status: "failed",
                                    })
                                )
                                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

                            return { success: false };
                        }
                    })
                );

                const failed = storageResults.some(
                    r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)
                );

                if (failed) hasError = true;

                await db
                    .update(drizzleDb.schemas.backup)
                    .set(
                        withUpdatedAt({
                            status: failed ? "failed" : "success",
                        })
                    )
                    .where(eq(drizzleDb.schemas.backup.id, migratedBackup.id));

            })
        );

        if (hasError) {
            return {
                success: false,
                actionError: {
                    message: "Migration completed with errors",
                    status: 500,
                },
            };
        }

        return {
            success: true,
            value: {},
            actionSuccess: {
                message: "Backups successfully migrated.",
                messageParams: {},
            },
        };

    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "Migration failed unexpectedly",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});