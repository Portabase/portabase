import {NextResponse} from "next/server";
import {Body} from "@/features/agents/types";
import {Agent} from "@/db/schema/08_agent";
import {DatabaseWith} from "@/db/schema/07_database";
import * as drizzleDb from "@/db";
import {db as dbClient} from "@/db";
import {and, eq, inArray, desc, sql} from "drizzle-orm";
import {dbmsEnumSchema, EDbmsSchema} from "@/db/schema/types";
import {withUpdatedAt} from "@/db/utils";
import {Setting} from "@/db/schema/01_setting";
import {logger} from "@/lib/logger";
import {isUUID} from "@/utils/text";
import {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {getMasterServerKeyContent} from "@/features/agents/actions/keys.action";
import {getDatabaseStorageChannels, PingDatabaseStorageChannels} from "./storage-channels.helpers";
import {applyStorageEncryption} from "./storage-encryption.helpers";
import {handleFailedRestoration} from "./restoration.helpers";

const log = logger.child({module: "api/agent/status/helpers"});

export async function handleDatabases(body: Body, agent: Agent, lastContact: Date, settings: Setting) {
    const databasesResponse = [];

    const masterKeyResult = await getMasterServerKeyContent();
    const masterKey = Buffer.isBuffer(masterKeyResult) ? masterKeyResult : null;
    if (!masterKey) {
        log.error({name: "handleDatabases"}, "Master key unavailable; storages will be sent in plaintext");
    }

    const formatDatabase = (database: DatabaseWith, backupAction: boolean, restoreAction: boolean, UrlBackup: string | null, storages: PingDatabaseStorageChannels[], urlMeta: string | null, backupSize: number | null) => ({
        generatedId: database.agentDatabaseId,
        dbms: database.dbms,
        storages: storages,
        encrypt: settings.encryption,
        data: {
            backup: {
                action: backupAction,
                cron: database.backupPolicy,
            },
            restore: {
                action: restoreAction,
                file: UrlBackup,
                metaFile: urlMeta,
                size: backupSize
            },
        },
    });

    for (const db of body.databases) {

        const existingDatabase = await dbClient.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.agentDatabaseId, db.generatedId),
            with: {
                project: true
            }
        });

        let backupAction: boolean = false
        let restoreAction: boolean = false
        let urlBackup: string | null = null;
        let urlMeta: string | null = null
        let backupSize: number | null = null

        if (!existingDatabase) {
            if (!isUUID(db.generatedId)) {
                return NextResponse.json(
                    {error: "generatedId is not a valid uuid"},
                    {status: 500}
                );
            }
            if (!dbmsEnumSchema.safeParse(db.dbms).success) {
                log.error({name: "handleDatabases"},`Database type not available: ${db.dbms}`);
                continue;
            }

            const [databaseCreated] = await dbClient
                .insert(drizzleDb.schemas.database)
                .values({
                    agentId: agent.id,
                    name: db.name,
                    dbms: db.dbms as EDbmsSchema,
                    agentDatabaseId: db.generatedId,
                    lastContact: db.pingStatus ? lastContact : null,
                    healthErrorCount: null
                })
                .returning();

            if (databaseCreated) {
                await dbClient
                    .insert(drizzleDb.schemas.healthcheckLog)
                    .values({
                        kind: "database",
                        status: db.pingStatus ? "success" : "failed",
                        objectId: databaseCreated.id,
                        date: lastContact
                    })

                const storages = await getDatabaseStorageChannels(databaseCreated.id)

                const entry = formatDatabase(databaseCreated, backupAction, restoreAction, urlBackup, storages, null, null);
                applyStorageEncryption(entry, body.version, masterKey, agent.id);
                databasesResponse.push(entry);
            }
        } else {

            const [databaseUpdated] = await dbClient
                .update(drizzleDb.schemas.database)
                .set(withUpdatedAt({
                    name: db.name,
                    agentId: agent.id,
                    dbms: db.dbms as EDbmsSchema,
                    lastContact: db.pingStatus ? lastContact : existingDatabase.lastContact,
                    healthErrorCount: db.pingStatus ? null : existingDatabase.healthErrorCount,
                }))
                .where(eq(drizzleDb.schemas.database.id, existingDatabase.id))
                .returning();


            await dbClient
                .insert(drizzleDb.schemas.healthcheckLog)
                .values({
                    kind: "database",
                    status: db.pingStatus ? "success" : "failed",
                    objectId: databaseUpdated.id,
                    date: lastContact
                })


            const activeBackup = await dbClient.query.backup.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backup.databaseId, databaseUpdated.id),
                    inArray(drizzleDb.schemas.backup.status, ["waiting", "ongoing"])
                ),
                orderBy: [
                    sql`case when ${drizzleDb.schemas.backup.status} = 'waiting' then 0 else 1 end`,
                    desc(drizzleDb.schemas.backup.createdAt)
                ]
            })

            const restoration = await dbClient.query.restoration.findFirst({
                where: and(eq(drizzleDb.schemas.restoration.databaseId, databaseUpdated.id), eq(drizzleDb.schemas.restoration.status, "waiting")),
                with: {
                    backupStorage: true
                }
            })

            if (activeBackup && activeBackup.status === "waiting") {
                backupAction = true

                await dbClient
                    .update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({status: "ongoing"}))
                    .where(eq(drizzleDb.schemas.backup.id, activeBackup.id));
            }

            if (restoration) {
                restoreAction = true

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
                    metadata: {
                        storageId: restoration.backupStorage.storageChannelId,
                        fileKind: "backups"
                    }
                };

                const inputMeta: StorageInput = {
                    action: "get",
                    data: {
                        path: `${restoration.backupStorage.path}.meta`,
                        signedUrl: true,
                    },
                    metadata: {
                        storageId: restoration.backupStorage.storageChannelId,
                        fileKind: "backups"
                    }
                };


                try {
                    const result = await dispatchStorage(input, undefined, restoration.backupStorage.storageChannelId);
                    const resultMeta = await dispatchStorage(inputMeta, undefined, restoration.backupStorage.storageChannelId);

                    if (result.success) {
                        urlBackup = result.url ?? null;
                        urlMeta = resultMeta.url ?? null
                        backupSize = restoration.backupStorage.size
                    } else {
                        await dbClient
                            .update(drizzleDb.schemas.restoration)
                            .set(withUpdatedAt({status: "failed"}))
                            .where(eq(drizzleDb.schemas.restoration.id, restoration.id));

                        const errorMessage = "Failed to get backup URL";
                        log.error({error: errorMessage, name: "handleDatabases"}, "Restoration failed");

                        await handleFailedRestoration(restoration.id, databaseUpdated.id, errorMessage);

                        continue;
                    }
                } catch (err) {
                    log.error({error: err, name: "handleDatabases"}, "Restoration crashed unexpectedly");
                    await dbClient
                        .update(drizzleDb.schemas.restoration)
                        .set(withUpdatedAt({status: "failed"}))
                        .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
                    await handleFailedRestoration(restoration.id, databaseUpdated.id, "Restoration crashed unexpectedly");
                    continue;
                }

                await dbClient
                    .update(drizzleDb.schemas.restoration)
                    .set(withUpdatedAt({status: "ongoing"}))
                    .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
            }
            const storages = await getDatabaseStorageChannels(databaseUpdated.id)
            const entry = formatDatabase(databaseUpdated, backupAction, restoreAction, urlBackup, storages, urlMeta, backupSize);
            applyStorageEncryption(entry, body.version, masterKey, agent.id);
            databasesResponse.push(entry);
        }
    }
    return databasesResponse;
}
