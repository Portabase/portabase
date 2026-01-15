import { Backup, DatabaseWith } from "@/db/schema/07_database";
import { dispatchStorage } from "@/features/storages/dispatch";
import type { StorageInput, StorageResult } from "@/features/storages/types";
import * as drizzleDb from "@/db";
import { withUpdatedAt } from "@/db/utils";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { createHash } from "crypto";

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
        with: { storageChannel: true },
    });

    const defaultPolicy = settings?.storageChannel
        ? [{
            id: null,
            storageChannelId: settings.storageChannel.id,
            enabled: true
        }]
        : [];

    console.log(database.storagePolicies);

    const policies = (database.storagePolicies?.filter(p => p.enabled) || defaultPolicy);

    console.log("Policies", policies);


    if (!policies.length) {
        return [];
    }

    const path = `${database.project?.slug}/${fileName}`;
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
                data: { path, file },
            };

            // const result = await dispatchStorage(input, policy.id);
            let result: StorageResult;

            try {
                if (policy.id){
                    result = await dispatchStorage(input, policy.id);
                }else{
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
                .set(withUpdatedAt({ status: result.success ? "success" : "failed" }))
                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

            return result;
        })
    );

    console.log(results);

    const backupStatus = results.some(r => r.success) ? "success" : "failed";

    await db
        .update(drizzleDb.schemas.backup)
        .set(withUpdatedAt({ status: backupStatus }))
        .where(eq(drizzleDb.schemas.backup.id, backup.id));

    return results;
}
