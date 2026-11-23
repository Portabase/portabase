import "server-only";
import {and, desc, eq, inArray, isNull} from "drizzle-orm";
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

export async function currentChain(databaseId: string) {
    const channels = await getDatabaseStorageChannels(databaseId);
    const {nodes, storages} = await loadChain(databaseId);
    const parent = eligibleParent(nodes, storages, channels.map((channel) => channel.id));
    if (!parent) return null;
    return {parent, chainStartedAt: ancestorsOf(nodes, parent.id)[0].createdAt};
}

export async function parentOffer(database: {id: string; fullBackupCron: string | null}) {
    const chain = await currentChain(database.id);
    if (!chain) return null;

    const [parentManifest] = await db
        .select({manifest: drizzleDb.schemas.backupManifest.manifest})
        .from(drizzleDb.schemas.backupManifest)
        .where(eq(drizzleDb.schemas.backupManifest.backupId, chain.parent.id));
    if (!parentManifest) return null;

    return {
        backupId: chain.parent.id,
        chainStartedAt: chain.chainStartedAt.toISOString(),
        manifest: parentManifest.manifest,
        scheduledFulls: database.fullBackupCron !== null,
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

export async function expectedParents(
    database: {id: string; fullBackupCron: string | null},
    nodes: ChainNode[],
): Promise<Map<string, string>> {
    const expectedParentById = new Map<string, string>();
    const pendingIds = nodes
        .filter((node) => node.status === "waiting" && node.parentBackupId === null && node.deletedAt === null)
        .map((node) => node.id);
    if (pendingIds.length === 0) return expectedParentById;

    const chain = await currentChain(database.id);
    if (!chain) return expectedParentById;

    const pendingBackups = await db
        .select({id: drizzleDb.schemas.backup.id, fullRequested: drizzleDb.schemas.backup.fullRequested})
        .from(drizzleDb.schemas.backup)
        .where(inArray(drizzleDb.schemas.backup.id, pendingIds));
    for (const pendingBackup of pendingBackups) {
        if (await fullBackupReason(database, pendingBackup)) continue;
        expectedParentById.set(pendingBackup.id, chain.parent.id);
    }
    return expectedParentById;
}
