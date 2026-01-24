import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {dispatchStorage} from "@/features/storages/dispatch";
import type {
    StorageGetInput,
    StorageInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput
} from "@/features/storages/types";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import crypto, {createHash} from "crypto";
import {getServerUrl} from "@/utils/get-server-url";
import path from "path";

function computeChecksum(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
}

export async function storeBackupFiles(
    backup: Backup,
    database: DatabaseWith,
    file: Buffer,
    fileName: string
): Promise<StorageResult[]> {

    const settings = await db.query.setting.findFirst({
        where: eq(drizzleDb.schemas.setting.name, "system"),
        with: {storageChannel: true},
    });

    const defaultPolicy = settings?.storageChannel
        ? [{
            id: null,
            storageChannelId: settings.storageChannel.id,
            enabled: settings.storageChannel.enabled,
        }]
        : [];

    const enabledPolicies = database.storagePolicies?.filter(p => p.enabled) ?? [];

    const policies = enabledPolicies.length > 0
        ? enabledPolicies
        : defaultPolicy;

    console.debug("Policies", policies);

    if (!policies.length) {
        await db
            .update(drizzleDb.schemas.backup)
            .set(withUpdatedAt({
                status: "failed",
            }))
            .where(eq(drizzleDb.schemas.backup.id, backup.id));
        return [];
    }

    const path = `backups/${database.project?.slug}/${fileName}`;
    const size = file.length;
    const checksum = computeChecksum(file);

    const results = await Promise.all(
        policies.map(async policy => {
            const [backupStorage] = await db
                .insert(drizzleDb.schemas.backupStorage)
                .values({
                    backupId: backup.id,
                    storageChannelId: policy.storageChannelId,
                    status: "pending",
                    path,
                    size,
                    checksum,
                })
                .returning();

            const input: StorageInput = {
                action: "upload",
                data: {path, file},
            };

            let result: StorageResult;

            try {
                if (policy.id) {
                    result = await dispatchStorage(input, policy.id);
                } else {
                    result = await dispatchStorage(input, undefined, policy.storageChannelId);
                }

            } catch (err) {
                console.error(err);
                result = {
                    success: false,
                    provider: null,
                    error: err instanceof Error ? err.message : "Unknown error"
                };
            }

            await db
                .update(drizzleDb.schemas.backupStorage)
                .set(withUpdatedAt({status: result.success ? "success" : "failed"}))
                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

            return result;
        })
    );


    console.debug("Storage backup results", results);

    const backupStatus = results.some(r => r.success) ? "success" : "failed";

    await db
        .update(drizzleDb.schemas.backup)
        .set(withUpdatedAt({
            status: backupStatus,
            fileSize: size
        }))
        .where(eq(drizzleDb.schemas.backup.id, backup.id));

    return results;
}



export async function generateFileUrl(input: { data: StorageGetInput | StorageUploadInput, metadata?: StorageMetaData }): Promise<string | null> {
    const fileName = path.basename(input.data.path);
    const baseUrl = getServerUrl();
    const metadata = input.metadata;

    if (!metadata){
        return null;
    }

    let params = new URLSearchParams({
        storageId: metadata.storageId,
    });

    if (metadata.fileKind === "backups") {
        const crypto = require("crypto");
        const expiresAt = Date.now() + 60 * 1000;
        const token = crypto.createHash("sha256").update(`${fileName}${expiresAt}`).digest("hex");

        params.set("path", input.data.path);
        params.set("token", token);
        params.set("expires", expiresAt.toString());
        return `${baseUrl}/api/files/${metadata.fileKind}/?${params.toString()}`
    }else if (metadata.fileKind === "images") {
        return `${baseUrl}/api/files/${metadata.fileKind}/${fileName}?${params.toString()}`
    }else {
        return null
    }
}