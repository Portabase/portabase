"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";


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

        console.log(backupStorage);

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

        console.log(result);

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