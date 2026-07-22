"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Backup} from "@/db/schema/07_database";
import {v4 as uuidv4} from "uuid";
import {and, eq, isNull} from "drizzle-orm";
import {z} from "zod";
import {storeBackupFiles} from "@/features/storages/utils/storages.helpers";
import {inspectUpload, InvalidUploadError, packToTarGz} from "@/features/database/utils/archive-inspect";


export const uploadBackupAction = userAction
    .schema(z.instanceof(FormData))
    .action(async ({parsedInput: formData}): Promise<ServerActionResult<Backup>> => {
        try {
            const file = formData.get("file") as File;
            const databaseId = formData.get("databaseId") as string;

            const database = await db.query.database.findFirst({
                where: and(
                    eq(drizzleDb.schemas.database.id, databaseId),
                    isNull(drizzleDb.schemas.database.deletedAt),
                ),
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

            const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
            if (file.size > MAX_UPLOAD_BYTES) {
                return {
                    success: false,
                    actionError: {
                        message: "File exceeds the 2 GB upload limit.",
                        status: 413,
                        cause: "File too large",
                    },
                };
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let inspection;
            try {
                inspection = await inspectUpload(buffer, database.dbms);
            } catch (error) {
                if (error instanceof InvalidUploadError) {
                    return {
                        success: false,
                        actionError: {
                            message: error.message,
                            status: 400,
                            cause: "Invalid backup archive",
                        },
                    };
                }
                throw error;
            }

            let fileBuffer: Buffer = buffer;
            if (inspection.kind === "wrap" && inspection.innerName) {
                fileBuffer = await packToTarGz(buffer, inspection.innerName);
            }

            const uuid = uuidv4();
            const fileName = `${uuid}${inspection.storeExtension}`;


            const [backup] = await db
                .insert(drizzleDb.schemas.backup)
                .values({
                    imported: true,
                    status: 'ongoing',
                    databaseId: database.id,
                })
                .returning();

            await storeBackupFiles(backup, database, fileBuffer, fileName)

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

