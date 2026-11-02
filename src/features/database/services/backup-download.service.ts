import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {isReplica} from "@/features/database/utils/backup-method";

export type BackupDownloadResult =
    | { ok: true; url: string }
    | { ok: false; status: 404 | 409 | 500; error: string };

export async function getBackupDownloadUrlService(backupStorageId: string): Promise<BackupDownloadResult> {
    const backupStorage = await db.query.backupStorage.findFirst({
        where: eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
    });

    if (!backupStorage) return {ok: false, status: 404, error: "Backup storage not found."};
    if (backupStorage.status !== "success" || !backupStorage.path) {
        return {ok: false, status: 409, error: "Backup storage is not available for download."};
    }
    if (backupStorage.presence === "missing") {
        return {ok: false, status: 409, error: "This backup file is missing and cannot be downloaded."};
    }
    if (backupStorage.engine === "restic") {
        return {ok: false, status: 409, error: "Snapshots cannot be downloaded as a file."};
    }
    if (isReplica(backupStorage.engine)) {
        return {ok: false, status: 409, error: "A replica cannot be downloaded as a file."};
    }

    const input: StorageInput = {
        action: "get",
        data: {
            path: backupStorage.path,
            signedUrl: true,
        },
        metadata: {
            storageId: backupStorage.storageChannelId,
            fileKind: "backups",
        },
    };

    const result = await dispatchStorage(input, undefined, backupStorage.storageChannelId);
    if (!result.success || !result.url) return {ok: false, status: 500, error: "Failed to get presigned url."};
    return {ok: true, url: result.url};
}
