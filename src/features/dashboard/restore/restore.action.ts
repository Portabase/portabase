"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";

import {db} from "@/db";
import {and, eq} from "drizzle-orm";
import {Backup, Restoration} from "@/db/schema/07_database";

export const deleteRestoreAction = userAction
    .schema(
        z.object({
            restorationId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
        try {
            await db
                .delete(drizzleDb.schemas.restoration)
                .where(and(eq(drizzleDb.schemas.restoration.id, parsedInput.restorationId)))
                .execute();


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
    .schema(
        z.object({
            restorationId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Restoration>> => {
        try {
            const updateResult = await db
                .update(drizzleDb.schemas.restoration)
                .set({status: "waiting"})
                .where(eq(drizzleDb.schemas.restoration.id, parsedInput.restorationId))
                .returning()
                .execute();

            const updatedRestoration = updateResult[0];

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
