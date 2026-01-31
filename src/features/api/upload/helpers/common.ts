import fs from "fs";
import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {dispatchStorage} from "@/features/storages/dispatch";
import type {StorageInput, StorageResult} from "@/features/storages/types";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {saveStreamToTempFile} from "@/features/api/upload/helpers/file";


/**
 * Save stream to a temporary file and upload to all storage providers in parallel.
 */
export default async function uploadTempFileToProviders(
    backup: Backup,
    database: DatabaseWith,
    inputStream: NodeJS.ReadableStream,
    fileName: string
): Promise<StorageResult[]> {

    const tmpPath = await saveStreamToTempFile(inputStream, fileName);

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
            console.log(result);

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

    return results;
}
