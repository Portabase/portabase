import "server-only";
import {eq, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {getDatabaseStorageChannels} from "@/features/agents/utils/status/storage-channels.helpers";
import {ancestorsOf, eligibleParent, type ChainNode, type ChainStorage} from "@/features/database/utils/physical-chain";

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
        .where(inArray(drizzleDb.schemas.backupStorage.backupId, nodes.map((node) => node.id)));

    return {nodes, storages};
}

export async function parentOffer(databaseId: string) {
    const channels = await getDatabaseStorageChannels(databaseId);
    const {nodes, storages} = await loadChain(databaseId);
    const parent = eligibleParent(nodes, storages, channels.map((channel) => channel.id));
    if (!parent) return null;

    const chainStart = ancestorsOf(nodes, parent.id)[0];
    const [parentRow] = await db
        .select({manifest: drizzleDb.schemas.backup.manifest})
        .from(drizzleDb.schemas.backup)
        .where(eq(drizzleDb.schemas.backup.id, parent.id));
    if (!parentRow?.manifest) return null;

    return {
        backupId: parent.id,
        chainStartedAt: chainStart.createdAt.toISOString(),
        manifest: parentRow.manifest,
    };
}
