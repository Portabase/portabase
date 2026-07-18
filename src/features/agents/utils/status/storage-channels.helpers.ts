import * as drizzleDb from "@/db";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import {getBackupFilePrefix} from "@/env";

export type PingDatabaseStorageChannels = {
    id: string;
    config: any
    provider: string
    prefix: string
}

export async function getDatabaseStorageChannels(databaseId: string): Promise<PingDatabaseStorageChannels[]> {

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

    const prefix = getBackupFilePrefix();

    const settings = await db.query.setting.findFirst({
        where: eq(drizzleDb.schemas.setting.name, "system"),
        with: {storageChannel: true},
    });

    const defaultStorageChannel: PingDatabaseStorageChannels[] = settings?.storageChannel
        ? [{
            id: settings.storageChannel.id,
            provider: settings.storageChannel.provider,
            config: settings.storageChannel.config,
            prefix,
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
                    prefix,
                } as PingDatabaseStorageChannels;
            })
    );

    const filteredChannels: PingDatabaseStorageChannels[] = enabledDatabaseStorageChannels.filter(
        (c): c is PingDatabaseStorageChannels => c !== null
    );

    return filteredChannels.length > 0 ? filteredChannels : defaultStorageChannel;
}
