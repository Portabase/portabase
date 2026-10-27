import * as drizzleDb from "@/db";
import {db as dbClient} from "@/db";
import {and, eq} from "drizzle-orm";
import {logger} from "@/lib/logger";
import {sendNotificationsBackupRestore} from "@/features/notifications/utils/notifications.helpers";
import type {BackupStorage} from "@/db/schema/14_storage-backup";
import {agentSupportsRestic, MIN_RESTIC_AGENT_VERSION} from "@/features/agents/utils/version";
import {encryptStorages} from "@/utils/status-crypto";
import {getBackupFolderName} from "@/utils/file-prefix";
import type {PingDatabaseStorageChannels} from "./storage-channels.helpers";
import {withUpdatedAt} from "@/db/utils";
import {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {isReplica} from "@/features/database/utils/backup-method";

const log = logger.child({module: "api/agent/status/restoration"});

export async function handleFailedRestoration(restorationId: string, databaseId: string, reason: string): Promise<void> {
    try {
        await dbClient
            .insert(drizzleDb.schemas.jobLog)
            .values({
                backupId: null,
                restorationId,
                loggedAt: new Date(),
                entryType: "log",
                level: "error",
                message: reason,
                command: null,
                output: null,
                exitCode: null,
                durationMs: null,
            });

        const databaseWithPolicies = await dbClient.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, databaseId),
            with: {alertPolicies: true, project: {with: {alertPolicies: true}}},
        });

        if (databaseWithPolicies) {
            await sendNotificationsBackupRestore(databaseWithPolicies, "error_restore");
        }
    } catch (err) {
        log.error({error: err, name: "handleFailedRestoration"}, "Failed to record restoration failure job log / notification");
    }
}


export async function buildResticRestore(
    backupStorage: BackupStorage,
    agentVersion: string | undefined,
    masterKey: Buffer | null,
): Promise<{ payload: Record<string, unknown> } | { error: string }> {
    if (!agentSupportsRestic(agentVersion)) {
        return {error: `Agent too old for snapshot restore (needs ${MIN_RESTIC_AGENT_VERSION} or later)`};
    }
    if (!masterKey) {
        return {error: "Master key unavailable; cannot send the snapshot restore"};
    }
    try {
        const channel = await dbClient.query.storageChannel.findFirst({
            where: eq(drizzleDb.schemas.storageChannel.id, backupStorage.storageChannelId),
        });
        if (!channel) {
            return {error: "The storage channel of this snapshot no longer exists"};
        }
        const storage: PingDatabaseStorageChannels = {
            id: channel.id,
            provider: channel.provider,
            config: channel.config,
            folderName: getBackupFolderName(),
        };
        return {
            payload: {
                engine: "restic",
                snapshotId: backupStorage.path,
                storageCiphertext: encryptStorages([storage], masterKey),
            },
        };
    } catch (err) {
        return {error: `Snapshot restore payload could not be built: ${err instanceof Error ? err.message : String(err)}`};
    }
}

export async function prepareRestoration(
    databaseId: string,
    agentVersion: string | undefined,
    masterKey: Buffer | null,
): Promise<{file: string | null; metaFile: string | null; size: number | null; restic: Record<string, unknown> | null} | null> {
    const restoration = await dbClient.query.restoration.findFirst({
        where: and(eq(drizzleDb.schemas.restoration.databaseId, databaseId), eq(drizzleDb.schemas.restoration.status, "waiting")),
        with: {
            backupStorage: true
        }
    })

    if (!restoration) return null;

    if (!restoration.backupStorage || restoration.backupStorage.status != "success" || !restoration.backupStorage.path) {
        return null;
    }

    const setStatus = (status: "failed" | "ongoing") => dbClient
        .update(drizzleDb.schemas.restoration)
        .set(withUpdatedAt({status}))
        .where(eq(drizzleDb.schemas.restoration.id, restoration.id));

    const fail = async (reason: string) => {
        await setStatus("failed");
        await handleFailedRestoration(restoration.id, databaseId, reason);
        return null;
    };

    if (isReplica(restoration.backupStorage.engine)) {
        return fail("A replica cannot be restored.");
    }

    if (restoration.backupStorage.engine === "restic") {
        const built = await buildResticRestore(restoration.backupStorage, agentVersion, masterKey);
        if ("error" in built) return fail(built.error);
        await setStatus("ongoing");
        return {file: null, metaFile: null, size: null, restic: built.payload};
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

    let file: string | null;
    let metaFile: string | null;

    try {
        const result = await dispatchStorage(input, undefined, restoration.backupStorage.storageChannelId);
        const resultMeta = await dispatchStorage(inputMeta, undefined, restoration.backupStorage.storageChannelId);

        if (result.file && typeof (result.file as any).destroy === "function") {
            (result.file as any).destroy();
        }
        if (resultMeta.file && typeof (resultMeta.file as any).destroy === "function") {
            (resultMeta.file as any).destroy();
        }

        if (!result.success) {
            const errorMessage = "Failed to get backup URL";
            log.error({error: errorMessage, name: "prepareRestoration"}, "Restoration failed");
            return fail(errorMessage);
        }

        file = result.url ?? null;
        metaFile = resultMeta.url ?? null;
    } catch (err) {
        log.error({error: err, name: "prepareRestoration"}, "Restoration crashed unexpectedly");
        return fail("Restoration crashed unexpectedly");
    }

    await setStatus("ongoing");

    return {file, metaFile, size: restoration.backupStorage.size, restic: null};
}
