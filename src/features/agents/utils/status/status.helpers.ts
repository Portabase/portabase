import {NextResponse} from "next/server";
import {Body} from "@/features/agents/types";
import {Agent} from "@/db/schema/08_agent";
import {DatabaseWith} from "@/db/schema/07_database";
import * as drizzleDb from "@/db";
import {db as dbClient} from "@/db";
import {and, eq, inArray, desc, sql, isNull, isNotNull} from "drizzle-orm";
import {dbmsEnumSchema, EDbmsSchema} from "@/db/schema/types";
import {withUpdatedAt} from "@/db/utils";
import {Setting} from "@/db/schema/01_setting";
import {logger} from "@/lib/logger";
import {isUUID} from "@/utils/text";
import {getMasterServerKeyContent} from "@/features/agents/utils/keys.server";
import {getDatabaseStorageChannels, PingDatabaseStorageChannels} from "./storage-channels.helpers";
import {applyStorageEncryption} from "./storage-encryption.helpers";
import {applyConfigEncryption} from "./config-encryption.helpers";
import {isAgentVersionAtLeast, MIN_AGENT_VERSION_DB_CONFIG} from "@/utils/status-crypto";
import {prepareRestoration} from "./restoration.helpers";
import {resolveBackupCron} from "@/features/database/utils/policy-resolution";
import {agentSupportsPhysical} from "@/features/agents/utils/version";
import {engineFromWire, resolveMethodConflict} from "@/features/database/utils/backup-method";

const log = logger.child({module: "api/agent/status/helpers"});

export async function handleDatabases(body: Body, agent: Agent, lastContact: Date, settings: Setting) {
    const databasesResponse = [];

    let masterKey: Buffer | null = null;
    try {
        masterKey = await getMasterServerKeyContent();
    } catch {
        log.error({name: "handleDatabases"}, "Master key unavailable; storages withheld");
    }

    const formatDatabase = (database: DatabaseWith, backupAction: boolean, restoreAction: boolean, UrlBackup: string | null, storages: PingDatabaseStorageChannels[], urlMeta: string | null, backupSize: number | null, cron: string | null) => {
        const rawConfig = database.deletedAt ? null : database.config;
        const config =
            rawConfig == null
                ? null
                : {
                    name: database.name,
                    type: database.dbms,
                    ...(rawConfig as Record<string, unknown>),
                    generated_id: database.agentDatabaseId,
                };

        const physicalUnsupported = database.backupEngine === "physical" && !agentSupportsPhysical(body.version);
        if (physicalUnsupported) {
            log.warn({name: "handleDatabases", databaseId: database.id, agentVersion: body.version}, "agent too old for physical backups");
        }

        return {
            generatedId: database.agentDatabaseId,
            dbms: database.dbms,
            storages: storages,
            encrypt: settings.encryption,
            data: {
                backup: {action: physicalUnsupported ? false : backupAction, cron: physicalUnsupported ? null : cron, engine: database.backupEngine},
                restore: {action: restoreAction, file: UrlBackup, metaFile: urlMeta, size: backupSize},
            },
            config,
        };
    };

    for (const db of body.databases) {

        const existingDatabase = await dbClient.query.database.findFirst({
            where: and(
                eq(drizzleDb.schemas.database.agentDatabaseId, db.generatedId),
                eq(drizzleDb.schemas.database.agentId, agent.id),
                isNull(drizzleDb.schemas.database.deletedAt),
            ),
            with: {
                project: true
            }
        });

        let backupAction: boolean = false
        let restoreAction: boolean = false
        let urlBackup: string | null = null;
        let urlMeta: string | null = null
        let backupSize: number | null = null
        let enginePayload: Record<string, unknown> | null = null

        if (!existingDatabase) {
            const foreignDatabase = await dbClient.query.database.findFirst({
                where: and(
                    eq(drizzleDb.schemas.database.agentDatabaseId, db.generatedId),
                    isNull(drizzleDb.schemas.database.deletedAt),
                ),
                columns: {agentId: true},
            });
            if (foreignDatabase) {
                log.warn({
                    name: "handleDatabases",
                    agentId: agent.id,
                    ownerAgentId: foreignDatabase.agentId,
                    generatedId: db.generatedId
                }, "Ignoring agent report of a database owned by another agent");
                continue;
            }

            const [tombstone] = await dbClient
                .update(drizzleDb.schemas.database)
                .set(withUpdatedAt({agentDatabaseId: null}))
                .where(and(
                    eq(drizzleDb.schemas.database.agentDatabaseId, db.generatedId),
                    isNotNull(drizzleDb.schemas.database.deletedAt),
                ))
                .returning({id: drizzleDb.schemas.database.id});
            if (tombstone) {
                log.info({
                    name: "handleDatabases",
                    generatedId: db.generatedId
                }, "Ignoring agent report of a database deleted from the dashboard");
                continue;
            }

            if (!isUUID(db.generatedId)) {
                return NextResponse.json(
                    {error: "generatedId is not a valid uuid"},
                    {status: 500}
                );
            }
            if (!dbmsEnumSchema.safeParse(db.dbms).success) {
                log.error({name: "handleDatabases"}, `Database type not available: ${db.dbms}`);
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
                    healthErrorCount: null,
                    backupEngine: db.dbms === "files" || db.dbms === "postgresql-cluster" ? (engineFromWire(db.method) ?? "archive") : "archive",
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

                const entry = formatDatabase(databaseCreated, backupAction, restoreAction, urlBackup, storages, null, null, databaseCreated.backupPolicy ?? null);
                applyStorageEncryption(entry, body.version, masterKey, agent.id);
                applyConfigEncryption(entry, body.version, masterKey, agent.id);
                databasesResponse.push(entry);
            }
        } else {
            // Non-files sources implicitly announce "archive": a files source turned into another dbms conflicts too.
            const methodConflict = resolveMethodConflict(
                existingDatabase.backupEngine,
                db.dbms === "files" || db.dbms === "postgresql-cluster" ? db.method : "archive",
            );
            if (methodConflict !== existingDatabase.methodConflict) {
                log.warn({name: "handleDatabases", databaseId: existingDatabase.id, announced: methodConflict, stored: existingDatabase.backupEngine}, "backup method conflict changed");
            }

            const isDashboardManaged = existingDatabase.config != null;

            const [databaseUpdated] = await dbClient
                .update(drizzleDb.schemas.database)
                .set(withUpdatedAt({
                    ...(isDashboardManaged ? {} : {name: db.name, dbms: db.dbms as EDbmsSchema}),
                    lastContact: db.pingStatus ? lastContact : existingDatabase.lastContact,
                    healthErrorCount: db.pingStatus ? null : existingDatabase.healthErrorCount,
                    methodConflict,
                }))
                .where(and(
                    eq(drizzleDb.schemas.database.id, existingDatabase.id),
                    eq(drizzleDb.schemas.database.agentId, agent.id),
                ))
                .returning();
            if (!databaseUpdated) continue;


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
                    sql`case when
                    ${drizzleDb.schemas.backup.status}
                    =
                    'waiting'
                    then
                    0
                    else
                    1
                    end`,
                    desc(drizzleDb.schemas.backup.createdAt)
                ]
            })

            if (activeBackup && activeBackup.status === "waiting" && !methodConflict) {
                backupAction = true

                await dbClient
                    .update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({status: "ongoing"}))
                    .where(eq(drizzleDb.schemas.backup.id, activeBackup.id));
            }

            const restore = await prepareRestoration(databaseUpdated.id, body.version, masterKey);
            if (restore) {
                restoreAction = true
                urlBackup = restore.file
                urlMeta = restore.metaFile
                backupSize = restore.size
                enginePayload = restore.enginePayload
            }
            const resolvedCron = resolveBackupCron({
                ...databaseUpdated,
                project: existingDatabase.project,
            } as DatabaseWith);
            const storages = await getDatabaseStorageChannels(databaseUpdated.id)
            const entry = formatDatabase(databaseUpdated, backupAction, restoreAction, urlBackup, storages, urlMeta, backupSize, methodConflict ? null : resolvedCron);
            if (enginePayload) Object.assign(entry.data.restore, enginePayload);
            applyStorageEncryption(entry, body.version, masterKey, agent.id);
            applyConfigEncryption(entry, body.version, masterKey, agent.id);
            databasesResponse.push(entry);
        }
    }

    if (isAgentVersionAtLeast(body.version, MIN_AGENT_VERSION_DB_CONFIG)) {
        const seenIds = new Set(body.databases.map((d) => d.generatedId));

        const dashboardDbs = await dbClient.query.database.findMany({
            where: and(
                eq(drizzleDb.schemas.database.agentId, agent.id),
                isNotNull(drizzleDb.schemas.database.config),
                isNull(drizzleDb.schemas.database.deletedAt),
            ),
            with: {project: true},
        });

        for (const dashDb of dashboardDbs) {
            if (dashDb.agentDatabaseId && seenIds.has(dashDb.agentDatabaseId)) continue;

            const storages = await getDatabaseStorageChannels(dashDb.id);
            const resolvedCron = resolveBackupCron(dashDb as DatabaseWith);
            const entry = formatDatabase(dashDb, false, false, null, storages, null, null, resolvedCron);
            applyStorageEncryption(entry, body.version, masterKey, agent.id);
            applyConfigEncryption(entry, body.version, masterKey, agent.id);
            databasesResponse.push(entry);
        }
    }

    return databasesResponse;
}
