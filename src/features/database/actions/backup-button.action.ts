"use server";

import {z} from "zod";
import {db} from "@/db";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";
import {Backup} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {userAction} from "@/lib/safe-actions/actions";

export const backupButtonAction = userAction.schema(z.string()).action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
    try {
        const [createdBackup] = await db
            .insert(drizzleDb.schemas.backup)
            .values({
                databaseId: parsedInput,
                status: "waiting",
            })
            .returning();

        return {
            success: true,
            value: createdBackup,
            actionSuccess: {
                message: "Backup has been successfully created.",
                messageParams: {databaseId: parsedInput},
            },
        };
    } catch (error) {
        console.error("Error creating backup:", error);

        return {
            success: false,
            actionError: {
                message: "Failed to create backup.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {databaseId: parsedInput},
            },
        };
    }
});
