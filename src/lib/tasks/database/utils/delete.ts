"use server"
import {action} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {Backup} from "@/db/schema/07_database";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq} from "drizzle-orm";
import {deleteFileS3Private, deleteLocalPrivate} from "@/features/upload/private/upload.action";
import {env} from "@/env.mjs";
import {withUpdatedAt} from "@/db/utils";


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

            const [settings] = await db.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);
            if (!settings) {
                return {
                    success: false,
                    actionError: {
                        message: "No settings found.",
                        status: 404,
                        cause: "No settings found.",
                        messageParams: {message: "Error deleting the backup"},
                    },
                };
            }

            await db
                .update(drizzleDb.schemas.backup)
                .set(withUpdatedAt({
                    deletedAt: new Date(),
                }))
                .where(and(eq(drizzleDb.schemas.backup.id, parsedInput.backupId), eq(drizzleDb.schemas.backup.databaseId, parsedInput.databaseId)))


            if (parsedInput.file) {
                let success: boolean, message: string;

                const result =
                    settings.storage === "local"
                        ? await deleteLocalPrivate(parsedInput.file)
                        : await deleteFileS3Private(`${parsedInput.projectSlug}/${parsedInput.file}`, env.S3_BUCKET_NAME!);

                ({success, message} = result);

                if (!success) {
                    return {
                        success: false,
                        actionError: {
                            message: message,
                            status: 404,
                            cause: "Unable to delete backup from storage",
                            messageParams: {message: "Error deleting the backup"},
                        },
                    };
                }
            }


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