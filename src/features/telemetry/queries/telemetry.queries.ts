import { and, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db, schemas } from "@/db";
import { env } from "@/env.mjs";

export type RawCount = { key: string | null; count: number };

export type RawTelemetry = {
    orgsTotal: number;
    usersTotal: number;
    agentsTotal: number;
    databasesTotal: number;
    databasesByType: RawCount[];
    storageByBackend: RawCount[];
    notificationsByChannel: RawCount[];
    agentsByVersion: RawCount[];
    encryptionEnabled: boolean;
    apiEnabled: boolean;
    mcpEnabled: boolean;
    openapiEnabled: boolean;
    apiKeysTotal: number;
    backupSizeMedianBytes: number;
};

export async function collectRawTelemetry(): Promise<RawTelemetry> {
    const [
        orgs,
        users,
        agents,
        databases,
        databasesByType,
        storageByBackend,
        notificationsByChannel,
        agentsByVersion,
        settingRow,
        apiKeys,
        backupSizeMedian,
    ] = await Promise.all([
        db
            .select({ c: count() })
            .from(schemas.organization)
            .where(isNull(schemas.organization.deletedAt)),
        db.select({ c: count() }).from(schemas.user).where(isNull(schemas.user.deletedAt)),
        db
            .select({ c: count() })
            .from(schemas.agent)
            .where(and(isNull(schemas.agent.deletedAt), eq(schemas.agent.isArchived, false))),
        db
            .select({ c: count() })
            .from(schemas.database)
            .where(isNull(schemas.database.deletedAt)),
        db
            .select({ key: schemas.database.dbms, count: count() })
            .from(schemas.database)
            .where(isNull(schemas.database.deletedAt))
            .groupBy(schemas.database.dbms),
        db
            .select({ key: schemas.storageChannel.provider, count: count() })
            .from(schemas.storageChannel)
            .where(isNull(schemas.storageChannel.deletedAt))
            .groupBy(schemas.storageChannel.provider),
        db
            .select({ key: schemas.notificationChannel.provider, count: count() })
            .from(schemas.notificationChannel)
            .where(isNull(schemas.notificationChannel.deletedAt))
            .groupBy(schemas.notificationChannel.provider),
        db
            .select({ key: schemas.agent.version, count: count() })
            .from(schemas.agent)
            .where(and(isNull(schemas.agent.deletedAt), eq(schemas.agent.isArchived, false)))
            .groupBy(schemas.agent.version),
        db.select({ encryption: schemas.setting.encryption }).from(schemas.setting).limit(1),
        db.select({ c: count() }).from(schemas.apikey),
        db
            .select({
                median: sql<
                    string | null
                >`percentile_cont(0.5) within group (order by ${schemas.backup.fileSize})`,
            })
            .from(schemas.backup)
            .where(
                and(
                    eq(schemas.backup.status, "success"),
                    isNull(schemas.backup.deletedAt),
                    isNotNull(schemas.backup.fileSize),
                ),
            ),
    ]);

    return {
        orgsTotal: orgs[0]?.c ?? 0,
        usersTotal: users[0]?.c ?? 0,
        agentsTotal: agents[0]?.c ?? 0,
        databasesTotal: databases[0]?.c ?? 0,
        databasesByType,
        storageByBackend,
        notificationsByChannel,
        agentsByVersion,
        encryptionEnabled: settingRow[0]?.encryption ?? false,
        apiEnabled: env.API_ENABLED,
        mcpEnabled: env.MCP_ENABLED,
        openapiEnabled: env.OPENAPI_ENABLED,
        apiKeysTotal: apiKeys[0]?.c ?? 0,
        backupSizeMedianBytes: Math.round(Number(backupSizeMedian[0]?.median ?? 0)),
    };
}
