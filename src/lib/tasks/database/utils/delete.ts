"use server"
import {action} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {Backup} from "@/db/schema/07_database";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";


export const deleteBackupCronAction = action
    .schema(
        z.object({
            backupId: z.string(),
            databaseId: z.string(),
            projectSlug: z.string(),
            file: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        try {

            const backup = await db.query.backup.findFirst({
                where: and(eq(drizzleDb.schemas.backup.id, parsedInput.backupId), eq(drizzleDb.schemas.backup.databaseId, parsedInput.backupId))
            });

            if (!backup) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup not found.",
                        status: 404,
                        messageParams: {backupId: parsedInput.backupId},
                    },
                }
            }


            const backupStorages = await db.query.backupStorage.findMany({
                where: eq(drizzleDb.schemas.backupStorage.backupId, parsedInput.backupId),
            });


            if (!backupStorages) {
                return {
                    success: false,
                    actionError: {
                        message: "Backup storage not found.",
                        status: 404,
                        messageParams: {backupId: parsedInput.backupId},
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
                }))
                .where(and(eq(drizzleDb.schemas.backup.id, parsedInput.backupId), eq(drizzleDb.schemas.backup.databaseId, parsedInput.backupId)))

            return {
                success: true,
                actionSuccess: {
                    message: `Backup deleted successfully (${parsedInput.backupId}).`,
                },
            };

        } catch (error) {
            console.error(error);
            return {
                success: false,
                actionError: {
                    message: `Failed to delete backup(${parsedInput.backupId}).`,
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error deleting the backup"},
                },
            };
        }
    });