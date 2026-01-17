"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";
import {db} from "@/db";
import {and, eq, isNull, ne, sql} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {Backup, Restoration} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";


export const downloadBackupAction = userAction.schema(
    z.object({
        backupStorageId: z.string(),
    })
).action(async ({parsedInput}): Promise<ServerActionResult<string>> => {
    const {backupStorageId} = parsedInput;
    try {

        const backupStorage = await db.query.backupStorage.findFirst({
            where: eq(drizzleDb.schemas.backupStorage.id, backupStorageId),

        });

        if (!backupStorage) {
            return {
                success: false,
                actionError: {
                    message: "Backup storage not found.",
                    status: 404,
                    messageParams: {backupStorageId: backupStorageId},
                },
            };
        }
        if (backupStorage.status != "success" || !backupStorage.path) {
            return {
                success: false,
                actionError: {
                    message: "An error occurred.",
                    status: 500,
                    messageParams: {backupStorageId: backupStorageId},
                },
            }
        }

        const input: StorageInput = {
            action: "get",
            data: {
                path: backupStorage.path,
                signedUrl: true,
            },
        };

        const result = await dispatchStorage(input, undefined, backupStorage.storageChannelId);

        return {
            success: true,
            value: result.url,
            actionSuccess: {
                message: "Backup Storage downloaded successfully.",
                messageParams: {backupStorageId: backupStorageId},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to get presigned url.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {backupStorageId: backupStorageId},
            },
        };
    }
});


export const createRestorationBackupAction = userAction
    .schema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
            backupStorageId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Restoration>> => {
        try {
            const restorationData = await db
                .insert(drizzleDb.schemas.restoration)
                .values({
                    databaseId: parsedInput.databaseId,
                    backupId: parsedInput.backupId,
                    backupStorageId: parsedInput.backupStorageId,
                    status: "waiting",
                })
                .returning()
                .execute();

            const createdRestoration = restorationData[0];

            return {
                success: true,
                value: createdRestoration,
                actionSuccess: {
                    message: "Restoration has been successfully created.",
                    messageParams: {restorationId: createdRestoration.id},
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to create restoration.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error creating the restoration"},
                },
            };
        }
    });


export const deleteBackupStorageAction = userAction
    .schema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
            backupStorageId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        const {backupId, databaseId, backupStorageId} = parsedInput;

        try {
            const backup = await db.query.backup.findFirst({
                where: and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId))
            });

            if (!backup) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup not found.",
                        status: 404,
                        messageParams: {backupStorageId: backupStorageId},
                    },
                }
            }


            const backupStorage = await db.query.backupStorage.findFirst({
                where: eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
            });


            if (!backupStorage) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup storage not found.",
                        status: 404,
                        messageParams: {backupStorageId: backupStorageId},
                    },
                };
            }


            const [{count}] = await db
                .select({count: sql<number>`count(*)`})
                .from(drizzleDb.schemas.backupStorage)
                .where(
                    and(
                        eq(drizzleDb.schemas.backupStorage.backupId, backupId),
                        isNull(drizzleDb.schemas.backupStorage.deletedAt),
                        ne(drizzleDb.schemas.backupStorage.id, backupStorageId)
                    )
                );


            if (Number(count) === 0) {
                await db
                    .update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({
                        deletedAt: new Date(),
                        status: backup.status == "ongoing" ? "failed" : backup.status
                    }))
                    .where(and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId)))
            }

            await db
                .update(drizzleDb.schemas.backupStorage)
                .set(withUpdatedAt({
                    deletedAt: new Date(),
                }))
                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorageId))


            if (backupStorage.status != "success" || !backupStorage.path) {
                return {
                    success: false,
                    actionError: {
                        message: "An error occurred.",
                        status: 500,
                        messageParams: {backupStorageId: backupStorageId},
                    },
                }
            }


            const input: StorageInput = {
                action: "delete",
                data: {
                    path: backupStorage.path,
                },
            };

            await dispatchStorage(input, undefined, backupStorage.storageChannelId);

            return {
                success: true,
                value: backup,
                actionSuccess: {
                    message: `Backup deleted successfully.`,
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to delete backup.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error deleting the backup"},
                },
            };
        }
    });


export const deleteBackupAction = userAction
    .schema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        const {backupId, databaseId} = parsedInput;

        try {
            const backup = await db.query.backup.findFirst({
                where: and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId))
            });

            if (!backup) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup not found.",
                        status: 404,
                        messageParams: {backupId: backupId},
                    },
                }
            }


            const backupStorages = await db.query.backupStorage.findMany({
                where: eq(drizzleDb.schemas.backupStorage.backupId, backupId),
            });


            if (!backupStorages) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup storage not found.",
                        status: 404,
                        messageParams: {backupId: backupId},
                    },
                };
            }

            for (const backupStorage of backupStorages) {

                await db
                    .update(drizzleDb.schemas.backupStorage)
                    .set(withUpdatedAt({
                        deletedAt: new Date(),
                    }))
                    .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id))

                if (backupStorage.status != "success" || !backupStorage.path) {
                    continue;
                }

                const input: StorageInput = {
                    action: "delete",
                    data: {
                        path: backupStorage.path,
                    },
                };

                await dispatchStorage(input, undefined, backupStorage.storageChannelId);

            }

            await db
                .update(drizzleDb.schemas.backup)
                .set(withUpdatedAt({
                    deletedAt: new Date(),
                    status: backup.status == "ongoing" ? "failed" : backup.status
                }))
                .where(and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId)))


            return {
                success: true,
                value: backup,
                actionSuccess: {
                    message: `Backup deleted successfully (ref: ${parsedInput.backupId}).`,
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to delete backup.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error deleting the backup"},
                },
            };
        }
    });