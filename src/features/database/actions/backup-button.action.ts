"use server";

import {z} from "zod";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";
import {Backup} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {assertCanOperateDatabase} from "@/features/database/utils/database-acl";

export const backupButtonAction = userAction.inputSchema(z.string()).action(async ({parsedInput}): Promise<ServerActionResult<Backup>> => {
  try {
        await assertCanOperateDatabase(parsedInput);
  } catch {
        throw new ActionError("Not authorized");
  }

  console.log("Creating backup for databaseId:", parsedInput);

  try {
        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, parsedInput),
            columns: {methodConflict: true},
        });
        if (database?.methodConflict) {
            return {
                success: false,
                actionError: {
                    message: "Backups are suspended: databases.json announces a different backup method for this source.",
                    status: 409,
                    messageParams: {databaseId: parsedInput},
                },
            };
        }

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
