import fs from "fs";
import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {dispatchStorage} from "@/features/storages/dispatch";
import type {StorageInput, StorageResult} from "@/features/storages/types";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {sendNotificationsBackupRestore} from "@/features/notifications/helpers";
import {eventEmitter} from "@/features/shared/event";
import forge from "node-forge";
import crypto from "node:crypto";

/**
 * Save stream to a temporary file and upload to all storage providers in parallel.
 */
export default async function uploadTempFileToProviders(
    backup: Backup,
    database: DatabaseWith,
    // inputStream: NodeJS.ReadableStream,
    tmpPath: string,
    fileName: string
): Promise<StorageResult[]> {

    const stats = fs.statSync(tmpPath);
    const fileSize = stats.size;
    console.log(tmpPath);

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
    const policies = enabledPolicies.length ? enabledPolicies : defaultPolicy;

    if (!policies.length) {
        await db.update(drizzleDb.schemas.backup)
            .set(withUpdatedAt({status: "failed"}))
            .where(eq(drizzleDb.schemas.backup.id, backup.id));
        fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath);
        return [];
    }

    const storagePath = `backups/${database.project?.slug}/${fileName}`;

    const results = await Promise.all(
        policies.map(async (policy) => {
            const fileStream = fs.createReadStream(tmpPath);

            const [backupStorage] = await db.insert(drizzleDb.schemas.backupStorage)
                .values({
                    backupId: backup.id,
                    storageChannelId: policy.storageChannelId,
                    status: "pending",
                    path: storagePath,
                })
                .returning();

            const input: StorageInput = {
                action: "upload",
                data: {path: storagePath, file: fileStream, size: fileSize},
            };

            let result: StorageResult;

            try {
                result = policy.id
                    ? await dispatchStorage(input, policy.id)
                    : await dispatchStorage(input, undefined, policy.storageChannelId);
            } catch (err: any) {
                result = {success: false, provider: null, error: err.message};
            }
            await db.update(drizzleDb.schemas.backupStorage)
                .set(withUpdatedAt({status: result.success ? "success" : "failed"}))
                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

            return result;
        })
    );

    const backupStatus = results.some(r => r.success) ? "success" : "failed";
    await db.update(drizzleDb.schemas.backup)
        .set(withUpdatedAt({
            fileSize: fileSize,
            status: backupStatus
        }))
        .where(eq(drizzleDb.schemas.backup.id, backup.id));

    fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath);

    console.log(results);
    eventEmitter.emit('modification', {update: true});

    if (!backupStatus) {
        await sendNotificationsBackupRestore(database, "error_backup");
    }
    await sendNotificationsBackupRestore(database, "success_backup");

    return results;
}


export function createDecryptionStream(
    encryptedAesKeyHex: string,
    ivHex: string
) {
    const privateKeyPem = fs.readFileSync(
        "private/keys/server_private.pem",
        "utf8"
    );

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    const encryptedBytes = forge.util.hexToBytes(encryptedAesKeyHex);
    const aesKeyBytes = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: {md: forge.md.sha256.create()},
    });

    const aesKey = Buffer.from(aesKeyBytes, "binary");
    const iv = Buffer.from(ivHex, "hex");

    return crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
}