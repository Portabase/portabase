import {Backup, DatabaseWith} from "@/db/schema/07_database";
import {dispatchStorage} from "@/features/storages/dispatch";
import type {StorageInput, StorageResult} from "@/features/storages/types";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import {PassThrough} from "stream";
import fs from "node:fs";
import forge from "node-forge";
import crypto from "node:crypto";
import {pipeline} from "node:stream";
import { promisify } from "util";


export async function storeBackupFilesStream(
    backup: Backup,
    database: DatabaseWith,
    fileStream: NodeJS.ReadableStream,
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
    const policies = enabledPolicies.length ? enabledPolicies : defaultPolicy;

    if (!policies.length) {
        await db.update(drizzleDb.schemas.backup)
            .set(withUpdatedAt({status: "failed"}))
            .where(eq(drizzleDb.schemas.backup.id, backup.id));
        return [];
    }

    const storagePath = `backups/${database.project?.slug}/${fileName}`;
    // const teeStreams = teeStreamSafe(fileStream, policies.length);
    const teeStreams = teeStream(fileStream, policies.length);


    const results = await Promise.all(
        policies.map(async (policy, index) => {
            const pass = teeStreams[index];
            console.log("policy", index, policy.id)
            const [backupStorage] = await db
                .insert(drizzleDb.schemas.backupStorage)
                .values({
                    backupId: backup.id,
                    storageChannelId: policy.storageChannelId,
                    status: "pending",
                    path: storagePath,
                })
                .returning();

            const input: StorageInput = {
                action: "upload",
                data: {
                    path: storagePath,
                    file: teeStreams[index],
                },
            };


            let result: StorageResult;

            try {
                result = policy.id
                    ? await dispatchStorage(input, policy.id)
                    : await dispatchStorage(input, undefined, policy.storageChannelId);
            } catch (err: any) {
                pass.destroy(err);
                result = {success: false, provider: null, error: err.message};
            }

            await db.update(drizzleDb.schemas.backupStorage)
                .set(withUpdatedAt({status: result.success ? "success" : "failed"}))
                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

            return result;
        })
    );
    console.log("result upload", results);

    const backupStatus = results.some(r => r.success) ? "success" : "failed";

    await db.update(drizzleDb.schemas.backup)
        .set(withUpdatedAt({status: backupStatus}))
        .where(eq(drizzleDb.schemas.backup.id, backup.id));

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


export function getFileExtension(dbType: string) {
    switch (dbType) {
        case "postgresql":
            return ".dump";
        case "mysql":
            return ".sql";
        default:
            return ".dump";
    }
}

const pipelinePromise = promisify(pipeline);

function teeStream(stream: NodeJS.ReadableStream, n: number): PassThrough[] {
    const taps = Array.from({ length: n }, () => new PassThrough());
    taps.forEach(tap => pipelinePromise(stream, tap).catch(err => tap.destroy(err)));
    return taps;
}