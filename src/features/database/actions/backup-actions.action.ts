"use server"
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {refreshBackupManifestsForBackup} from "@/features/storages/utils/backup-manifest";
import {db} from "@/db";
import {and, eq, isNull, sql} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {Backup, Restoration} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {deleteBackupService, deleteBackupStorageObject} from "@/lib/tasks/database/utils/backup-delete.service";
import {assertCanOperateDatabase} from "@/features/database/utils/database-acl";

async function authorize(databaseId: string): Promise<void> {
    try {
        await assertCanOperateDatabase(databaseId);
    } catch {
        throw new ActionError("Not authorized");
    }
}


export const downloadBackupAction = userAction.inputSchema(
    z.object({
        backupStorageId: z.string(),
    })
).action(async ({parsedInput}): Promise<ServerActionResult<string>> => {
    const {backupStorageId} = parsedInput;
    try {

        const backupStorage = await db.query.backupStorage.findFirst({
            where: eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
            with: {backup: {columns: {databaseId: true}}},
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
        await authorize(backupStorage.backup.databaseId);
        if (backupStorage.status !== "success" || !backupStorage.path) {
            return {
                success: false,
                actionError: {
                    message: "An error occurred.",
                    status: 500,
                    messageParams: {backupStorageId: backupStorageId},
                },
            }
        }
        if (backupStorage.presence === "missing") {
            return {
                success: false,
                actionError: {
                    message: "This backup file is missing and cannot be downloaded.",
                    status: 409,
                    messageParams: {backupStorageId: backupStorageId},
                },
            }
        }
        if (backupStorage.engine === "restic") {
            return {
                success: false,
                actionError: {
                    message: "Snapshots cannot be downloaded as a file.",
                    status: 409,
                    messageParams: {backupStorageId: backupStorageId},
                },
            }
        }
        if (backupStorage.engine === "sync") {
            return {
                success: false,
                actionError: {
                    message: "A sync replica cannot be downloaded as a file.",
                    status: 409,
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
            metadata: {
                storageId: backupStorage.storageChannelId,
                fileKind: "backups"
            }
        };


        const result = await dispatchStorage(input, undefined, backupStorage.storageChannelId);
        return {
            success: result.success,
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
    .inputSchema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
            backupStorageId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Restoration>> => {
        await authorize(parsedInput.databaseId);
        try {
            const backupStorage = await db.query.backupStorage.findFirst({
                where: eq(drizzleDb.schemas.backupStorage.id, parsedInput.backupStorageId),
                with: {backup: {columns: {databaseId: true}}},
            });
            // Only a backup of this database can be restored into it.
            if (
                !backupStorage ||
                backupStorage.backupId !== parsedInput.backupId ||
                backupStorage.backup.databaseId !== parsedInput.databaseId ||
                backupStorage.status !== "success"
            ) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup storage is not available for restore.",
                        status: 409,
                        messageParams: {backupStorageId: parsedInput.backupStorageId},
                    },
                };
            }
            if (backupStorage.presence === "missing") {
                return {
                    success: false,
                    actionError: {
                        message: "This backup file is missing and cannot be restored.",
                        status: 409,
                        messageParams: {backupStorageId: parsedInput.backupStorageId},
                    },
                };
            }
            if (backupStorage.engine === "sync") {
                return {
                    success: false,
                    actionError: {
                        message: "A sync replica cannot be restored.",
                        status: 409,
                        messageParams: {backupStorageId: parsedInput.backupStorageId},
                    },
                };
            }

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
    .inputSchema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
            backupStorageId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        const {backupId, databaseId, backupStorageId} = parsedInput;
        await authorize(databaseId);

        try {
            const backup = await db.query.backup.findFirst({
                where: and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId)),
                with: {database: {columns: {agentDatabaseId: true}}},
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
                where: and(
                    eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
                    eq(drizzleDb.schemas.backupStorage.backupId, backupId),
                ),
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

            const result = await deleteBackupStorageObject(backupStorage, backup.database.agentDatabaseId);
            if (!result.deleted) {
                return {
                    success: false,
                    actionError: {
                        message: result.error ?? "Failed to delete backup.",
                        status: 409,
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
                    )
                );

            if (Number(count) === 0) {
                await db
                    .update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({
                        deletedAt: new Date(),
                        status: backup.status === "ongoing" ? "failed" : backup.status
                    }))
                    .where(and(eq(drizzleDb.schemas.backup.id, backupId), eq(drizzleDb.schemas.backup.databaseId, databaseId)))
            }

            await refreshBackupManifestsForBackup(backupId)

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
    .inputSchema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        const {backupId, databaseId} = parsedInput;
        await authorize(databaseId);

        try {
            const result = await deleteBackupService(backupId, databaseId);

            if (!result.ok) {
                return {
                    success: false,
                    actionError: {
                        message: result.error ?? "Failed to delete backup.",
                        status: result.error === "Backup not found." ? 404 : 409,
                        messageParams: {backupId: backupId},
                    },
                }
            }

            return {
                success: true,
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
