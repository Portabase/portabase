"use server"
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";

import {db} from "@/db";
import {eq} from "drizzle-orm";
import {Backup, Restoration} from "@/db/schema/07_database";
import {assertCanOperateDatabase} from "@/features/database/utils/database-acl";
import {deleteRestorationService, rerunRestorationService} from "@/features/database/services/restoration.service";

/** The restoration's database must be one the caller can operate on (owner/admin of its organization). */
async function authorize(restorationId: string): Promise<void> {
    try {
        const restoration = await db.query.restoration.findFirst({
            columns: {databaseId: true},
            where: eq(drizzleDb.schemas.restoration.id, restorationId),
        });
        if (!restoration?.databaseId) throw new Error("Restoration not found");
        await assertCanOperateDatabase(restoration.databaseId);
    } catch {
        throw new ActionError("Not authorized");
    }
}

export const deleteRestoreAction = userAction
    .inputSchema(
        z.object({
            restorationId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        await authorize(parsedInput.restorationId);
        try {
            await deleteRestorationService(parsedInput.restorationId);

            return {
                success: true,
                actionSuccess: {
                    message: "Restoration deleted successfully.",
                },
            };

        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to delete restoration.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error deleting the restoration"},
                },
            };
        }
    });

export const rerunRestorationAction = userAction
    .inputSchema(
        z.object({
            restorationId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Restoration>> => {
        await authorize(parsedInput.restorationId);
        try {
            const updatedRestoration = await rerunRestorationService(parsedInput.restorationId);

            if (!updatedRestoration) {
                return {
                    success: false,
                    actionError: {
                        message: "Restoration not found.",
                        status: 404,
                        cause: "No restoration with the given ID exists.",
                        messageParams: {message: "Restoration not found"},
                    },
                };
            }

            return {
                success: true,
                value: updatedRestoration,
                actionSuccess: {
                    message: "Restoration has been requeued.",
                    messageParams: {restorationId: updatedRestoration.id},
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to rerun restoration.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {message: "Error updating the restoration"},
                },
            };
        }
    });
