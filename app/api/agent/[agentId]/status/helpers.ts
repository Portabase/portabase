import {NextResponse} from "next/server";
import {Body} from "./route";
import {isUuidv4} from "@/utils/verify-uuid";
import {getFileUrlPresignedLocal, getFileUrlPreSignedS3Action} from "@/features/upload/private/upload.action";
import {Agent} from "@/db/schema/08_agent";
import {Database} from "@/db/schema/07_database";
import * as drizzleDb from "@/db";
import {db as dbClient} from "@/db";
import {and, eq, inArray} from "drizzle-orm";
import {EDbmsSchema} from "@/db/schema/types";
import {ServerActionResult} from "@/types/action-type";
import {SafeActionResult} from "next-safe-action";
import {ZodString} from "zod";
import {withUpdatedAt} from "@/db/utils";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";

export async function handleDatabases(body: Body, agent: Agent, lastContact: Date) {
    const databasesResponse = [];

    const formatDatabase = (database: Database, backupAction: boolean, restoreAction: boolean, UrlBackup: string) => ({
        generatedId: database.agentDatabaseId,
        dbms: database.dbms,
        data: {
            backup: {
                action: backupAction,
                cron: database.backupPolicy,
            },
            restore: {
                action: restoreAction,
                file: UrlBackup,
            },
        },
    });

    for (const db of body.databases) {

        const existingDatabase = await dbClient.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.agentDatabaseId, db.generatedId)
        });

        let backupAction: boolean = false
        let restoreAction: boolean = false
        let urlBackup: string = ""

        if (!existingDatabase) {
            if (!isUuidv4(db.generatedId)) {
                return NextResponse.json(
                    {error: "generatedId is not a valid uuid"},
                    {status: 500}
                );
            }
            const [databaseCreated] = await dbClient
                .insert(drizzleDb.schemas.database)
                .values({
                    agentId: agent.id,
                    name: db.name,
                    dbms: db.dbms as EDbmsSchema,
                    agentDatabaseId: db.generatedId,
                    lastContact: lastContact,
                })
                .returning();

            if (databaseCreated) {
                databasesResponse.push(formatDatabase(databaseCreated, backupAction, restoreAction, urlBackup));
            }
        } else {

            const [databaseUpdated] = await dbClient
                .update(drizzleDb.schemas.database)
                .set(withUpdatedAt({
                    name: db.name,
                    agentId: agent.id,
                    lastContact: lastContact
                }))
                .where(eq(drizzleDb.schemas.database.id, existingDatabase.id))
                .returning();


            // const backup = await dbClient.query.backup.findFirst({
            //     where: and(eq(drizzleDb.schemas.backup.databaseId, databaseUpdated.id), eq(drizzleDb.schemas.backup.status, "waiting"))
            // })

            const activeBackup = await dbClient.query.backup.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backup.databaseId, databaseUpdated.id),
                    inArray(drizzleDb.schemas.backup.status, ["waiting", "ongoing"])
                )
            })


            const restoration = await dbClient.query.restoration.findFirst({
                where: and(eq(drizzleDb.schemas.restoration.databaseId, databaseUpdated.id), eq(drizzleDb.schemas.restoration.status, "waiting")),
                with: {
                    backupStorage: true
                }
            })


            if (activeBackup && activeBackup.status == "waiting") {
                backupAction = true

                await dbClient
                    .update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({status: "ongoing"}))
                    .where(eq(drizzleDb.schemas.backup.id, activeBackup.id));
            }

            if (restoration) {
                restoreAction = true


                // const backupToRestore = await dbClient.query.backup.findFirst({
                //     where: eq(drizzleDb.schemas.backup.id, restoration.backupId),
                //     with: {
                //         database: {
                //             with: {
                //                 project: true
                //             }
                //         }
                //     }
                // })

                // const [settings] = await dbClient.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);
                // if (!settings) {
                //     return NextResponse.json(
                //         {error: "Unable to find settings"},
                //         {status: 500}
                //     );
                // }

                if (!restoration.backupStorage || restoration.backupStorage.status != "success" || !restoration.backupStorage.path) {
                    restoreAction = false
                    continue;
                }


                const input: StorageInput = {
                    action: "get",
                    data: {
                        path: restoration.backupStorage.path,
                        signedUrl: true,
                    },
                };


                try {
                    const result = await dispatchStorage(input, undefined, restoration.backupStorage.storageChannelId);

                    if (result.success) {
                        urlBackup = result.url ?? "";
                    } else {
                        await dbClient
                            .update(drizzleDb.schemas.restoration)
                            .set({status: "failed"})
                            .where(eq(drizzleDb.schemas.restoration.id, restoration.id));

                        const errorMessage = "Failed to get backup URL";
                        console.error("Restoration failed: ", errorMessage);
                        continue;
                    }
                } catch (err) {
                    console.error("Restoration crashed unexpectedly:", err);
                    await dbClient
                        .update(drizzleDb.schemas.restoration)
                        .set({status: "failed"})
                        .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
                    continue;
                }


                // const fileName = backupToRestore?.file
                //
                // let data: SafeActionResult<string, ZodString, readonly [], {
                //     _errors?: string[] | undefined;
                // }, readonly [], ServerActionResult<string>, object> | undefined
                //
                // try {
                //
                //     if (settings.storage == "local") {
                //         data = await getFileUrlPresignedLocal({fileName: fileName!})
                //     } else if (settings.storage == "s3") {
                //
                //         data = await getFileUrlPreSignedS3Action(`backups/${backupToRestore?.database.project?.slug}/${fileName}`);
                //     }
                //
                //     if (data?.data?.success) {
                //         urlBackup = data.data.value ?? "";
                //     } else {
                //         await dbClient
                //             .update(drizzleDb.schemas.restoration)
                //             .set({status: "failed"})
                //             .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
                //
                //         // @ts-ignore
                //         const errorMessage = data?.data?.actionError?.message || "Failed to get presigned URL";
                //         console.error("Restoration failed: ", errorMessage);
                //
                //         continue;
                //     }
                // } catch (err) {
                //     console.error("Restoration crashed unexpectedly:", err);
                //     await dbClient
                //         .update(drizzleDb.schemas.restoration)
                //         .set({status: "failed"})
                //         .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
                //
                //     continue;
                // }
                await dbClient
                    .update(drizzleDb.schemas.restoration)
                    .set({status: "ongoing"})
                    .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
            }
            databasesResponse.push(formatDatabase(databaseUpdated, backupAction, restoreAction, urlBackup));
        }
    }
    return databasesResponse;
}

