import {NextResponse} from "next/server";
import {Body} from "./route";
import {isUuidv4} from "@/utils/verify-uuid";
import {Agent} from "@/db/schema/08_agent";
import {Database, DatabaseWith} from "@/db/schema/07_database";
import * as drizzleDb from "@/db";
import {db, db as dbClient} from "@/db";
import {and, eq, inArray} from "drizzle-orm";
import {dbmsEnumSchema, EDbmsSchema} from "@/db/schema/types";
import {withUpdatedAt} from "@/db/utils";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";

export async function handleDatabases(body: Body, agent: Agent, lastContact: Date) {
    const databasesResponse = [];

    const formatDatabase = (database: DatabaseWith, backupAction: boolean, restoreAction: boolean, UrlBackup: string | null, storages: PingDatabaseStorageChannels[], urlMeta: string | null) => ({
        generatedId: database.agentDatabaseId,
        dbms: database.dbms,
        storages: storages,
        encrypt: false,
        data: {
            backup: {
                action: backupAction,
                cron: database.backupPolicy,
            },
            restore: {
                action: restoreAction,
                file: UrlBackup,
                metaFile: urlMeta
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

        if (!existingDatabase) {
            if (!isUuidv4(db.generatedId)) {
                return NextResponse.json(
                    {error: "generatedId is not a valid uuid"},
                    {status: 500}
                );
            }

            if (!dbmsEnumSchema.safeParse(db.dbms).success) {
                console.log(`Database type not available: ${db.dbms}`);
                continue;
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
                const storages = await getDatabaseStorageChannels(databaseCreated.id)

                databasesResponse.push(formatDatabase(databaseCreated, backupAction, restoreAction, urlBackup, storages, null));
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

                await dbClient
                    .update(drizzleDb.schemas.restoration)
                    .set({status: "ongoing"})
                    .where(eq(drizzleDb.schemas.restoration.id, restoration.id));
            }
            const storages = await getDatabaseStorageChannels(databaseUpdated.id)
            databasesResponse.push(formatDatabase(databaseUpdated, backupAction, restoreAction, urlBackup, storages, urlMeta));
        }
    }

    return databasesResponse;
}


type PingDatabaseStorageChannels = {
    id: string;
    config: any
    provider: string
}

async function getDatabaseStorageChannels(databaseId: string): Promise<PingDatabaseStorageChannels[]> {

    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.id, databaseId),
        with: {
            project: true,
            retentionPolicy: true,
            alertPolicies: true,
            storagePolicies: true
        }
    });

    if (!database) {
        return []
    }

    const settings = await db.query.setting.findFirst({
        where: eq(drizzleDb.schemas.setting.name, "system"),
        with: {storageChannel: true},
    });

    const defaultStorageChannel: PingDatabaseStorageChannels[] = settings?.storageChannel
        ? [{
            id: settings.storageChannel.id,
            provider: settings.storageChannel.provider,
            config: settings.storageChannel.config,
        }]
        : [];


    const enabledDatabaseStorageChannels = await Promise.all(
        (database.storagePolicies ?? [])
            .filter(p => p.enabled)
            .map(async policy => {
                const storageChannel = await db.query.storageChannel.findFirst({
                    where: eq(drizzleDb.schemas.storageChannel.id, policy.storageChannelId),
                });

                if (!storageChannel) return null;

                return {
                    id: storageChannel.id,
                    config: storageChannel.config,
                    provider: storageChannel.provider,
                } as PingDatabaseStorageChannels;
            })
    );

    const filteredChannels: PingDatabaseStorageChannels[] = enabledDatabaseStorageChannels.filter(
        (c): c is PingDatabaseStorageChannels => c !== null
    );

    return filteredChannels.length > 0 ? filteredChannels : defaultStorageChannel;
}

