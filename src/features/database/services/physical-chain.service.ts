import "server-only";
import {and, desc, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {getDatabaseStorageChannels} from "@/features/agents/utils/status/storage-channels.helpers";
import {ancestorsOf, eligibleParent, type ChainNode, type ChainStorage} from "@/features/database/utils/physical-chain";
import {cronFiredBetween} from "@/features/database/utils/cron-schedule";

export async function loadChain(databaseId: string): Promise<{nodes: ChainNode[]; storages: ChainStorage[]}> {
    const nodes = await db
        .select({
            id: drizzleDb.schemas.backup.id,
            parentBackupId: drizzleDb.schemas.backup.parentBackupId,
            status: drizzleDb.schemas.backup.status,
            createdAt: drizzleDb.schemas.backup.createdAt,
            deletedAt: drizzleDb.schemas.backup.deletedAt,
        })
        .from(drizzleDb.schemas.backup)
        .where(eq(drizzleDb.schemas.backup.databaseId, databaseId));

    if (nodes.length === 0) return {nodes, storages: []};

    const storages = await db
        .select({
            backupId: drizzleDb.schemas.backupStorage.backupId,
            storageChannelId: drizzleDb.schemas.backupStorage.storageChannelId,
            status: drizzleDb.schemas.backupStorage.status,
            presence: drizzleDb.schemas.backupStorage.presence,
            deletedAt: drizzleDb.schemas.backupStorage.deletedAt,
        })
        .from(drizzleDb.schemas.backupStorage)
        .innerJoin(drizzleDb.schemas.backup, eq(drizzleDb.schemas.backup.id, drizzleDb.schemas.backupStorage.backupId))
        .where(eq(drizzleDb.schemas.backup.databaseId, databaseId));

    return {nodes, storages};
}

export async function parentOffer(databaseId: string) {
    const channels = await getDatabaseStorageChannels(databaseId);
    const {nodes, storages} = await loadChain(databaseId);
    const parent = eligibleParent(nodes, storages, channels.map((channel) => channel.id));
    if (!parent) return null;

    const chainStart = ancestorsOf(nodes, parent.id)[0];
    const [parentManifest] = await db
        .select({manifest: drizzleDb.schemas.backupManifest.manifest})
        .from(drizzleDb.schemas.backupManifest)
        .where(eq(drizzleDb.schemas.backupManifest.backupId, parent.id));
    if (!parentManifest) return null;

    return {
        backupId: parent.id,
        chainStartedAt: chainStart.createdAt.toISOString(),
        manifest: parentManifest.manifest,
    };
}

/** Why this backup must be a full one (no parent offered), or null to let the chain decide. */
export async function fullBackupReason(
    database: {id: string; fullBackupCron: string | null},
    backup: {fullRequested: boolean},
): Promise<string | null> {
    if (backup.fullRequested) return "full backup requested from the dashboard";
    if (!database.fullBackupCron) return null;
    const [lastFull] = await db
        .select({createdAt: drizzleDb.schemas.backup.createdAt})
        .from(drizzleDb.schemas.backup)
        .where(and(
            eq(drizzleDb.schemas.backup.databaseId, database.id),
            isNull(drizzleDb.schemas.backup.parentBackupId),
            isNull(drizzleDb.schemas.backup.deletedAt),
            eq(drizzleDb.schemas.backup.status, "success"),
        ))
        .orderBy(desc(drizzleDb.schemas.backup.createdAt))
        .limit(1);
    if (!lastFull) return null;
    return cronFiredBetween(database.fullBackupCron, lastFull.createdAt, new Date())
        ? `the full backup schedule (${database.fullBackupCron}) is due`
        : null;
}
