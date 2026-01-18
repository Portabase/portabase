"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Backup} from "@/db/schema/07_database";
import {getFileExtension} from "../../../../../../app/api/agent/[agentId]/backup/helpers";
import {v4 as uuidv4} from "uuid";
import {eq} from "drizzle-orm";
import {uploadLocalPrivate, uploadS3Private} from "@/features/upload/private/upload.action";
import {z} from "zod";
import {env} from "@/env.mjs";
import {storeBackupFiles} from "@/features/storages/helpers";


export const uploadBackupAction = userAction
    .schema(z.instanceof(FormData))
    .action(async ({parsedInput: formData}): Promise<ServerActionResult<Backup>> => {
        try {
            const file = formData.get("file") as File;
            const databaseId = formData.get("databaseId") as string;

            const database = await db.query.database.findFirst({
                where: eq(drizzleDb.schemas.database.id, databaseId),
                with: {
                    project: true,
                    alertPolicies: true,
                    storagePolicies: true
                }
            });

            if (!database) {
                return {
                    success: false,
                    actionError: {
                        message: "Database does not exist",
                        status: 500,
                        cause: "Unknown error",
                    },
                };
            }

            const fileExtension = getFileExtension(database.dbms)

            const arrayBuffer = await file.arrayBuffer();

            const uuid = uuidv4();
            const fileName = `${uuid}${fileExtension}`;
            const buffer = Buffer.from(arrayBuffer);

            // const [settings] = await db.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);
            //
            // if (!settings) {
            //     return {
            //         success: false,
            //         actionError: {
            //             message: "Settings not set",
            //             status: 500,
            //             cause: "Unknown error",
            //         },
            //     };
            // }

            const [backup] = await db
                .insert(drizzleDb.schemas.backup)
                .values({
                    imported: true,
                    status: 'ongoing',
                    databaseId: database.id,
                })
                .returning();


            await storeBackupFiles(backup, database, buffer, fileName)


            // let success: boolean, message: string, filePath: string;
            //
            // const result =
            //     settings.storage === "local"
            //         ? await uploadLocalPrivate(fileName, buffer)
            //         : await uploadS3Private(`${database.project?.slug}/${fileName}`, buffer, env.S3_BUCKET_NAME!);
            //
            // ({success, message, filePath} = result);
            //
            // if (!success) {
            //     return {
            //         success: false,
            //         actionError: {
            //             message: "An error has occurred while uploading file",
            //             status: 500,
            //             cause: "Unknown error",
            //         },
            //     };
            // }

            return {
                success: true,
                value: backup,
                actionSuccess: {
                    message: `Backup successfully imported`,
                },
            };

        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to import backup.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });

