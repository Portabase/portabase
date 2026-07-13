import { and, count, eq, isNull } from "drizzle-orm";
import { db, schemas } from "@/db";

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
    };
}
