import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {Readable} from "node:stream";

import {SftpConfig} from "@/features/channel/components/storages/sftp/types";
import {RcloneConfig} from "@/features/channel/components/storages/rclone/types";
import {
    buildRcloneConfigText,
    obscurePassword,
} from "@/features/channel/components/storages/rclone/config";
import {
    checkRclone,
    copyRclone,
    deleteRclone,
    getRclone,
    pingRclone,
    uploadRclone,
} from "@/features/channel/components/storages/rclone";
import {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput,
} from "@/features/storages/types";

const PROVIDER = "sftp" as const;

async function toRcloneConfig(
    config: SftpConfig,
): Promise<{rclone: RcloneConfig; cleanup: () => void}> {
    let keyDir: string | null = null;
    let keyFile: string | undefined;
    let pass: string | undefined;

    try {
        if (config.privateKey && config.privateKey.trim()) {
            keyDir = await mkdtemp(path.join(tmpdir(), "portabase-sftp-"));
            keyFile = path.join(keyDir, "id_key");
            await writeFile(keyFile, config.privateKey, {mode: 0o600});
        }

        if (config.password && config.password.trim()) {
            pass = await obscurePassword(config.password);
        }
    } catch (e) {
        if (keyDir) await rm(keyDir, {recursive: true, force: true});
        throw e;
    }

    const cleanup = () => {
        if (keyDir) void rm(keyDir, {recursive: true, force: true});
    };

    return {
        rclone: {
            configText: buildRcloneConfigText("sftp", {
                type: "sftp",
                host: config.host,
                port: config.port,
                user: config.username,
                key_file: keyFile,
                pass,
            }),
            remoteName: "sftp",
            remotePath: config.remotePath ?? "",
        },
        cleanup,
    };
}

export async function uploadSftp(
    config: SftpConfig,
    input: {data: StorageUploadInput; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await uploadRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function getSftp(
    config: SftpConfig,
    input: {data: StorageGetInput; metadata: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await getRclone(rclone, input);
        const file = result.file instanceof Readable ? result.file : undefined;
        if (result.success && file) {
            file.on("close", cleanup);
        } else {
            cleanup();
        }
        return {...result, provider: PROVIDER};
    } catch (e) {
        cleanup();
        throw e;
    }
}

export async function deleteSftp(
    config: SftpConfig,
    input: {data: StorageDeleteInput; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await deleteRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function checkSftp(
    config: SftpConfig,
    input: {data: {path: string}; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await checkRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function copySftp(
    config: SftpConfig,
    input: {data: StorageCopyInput},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await copyRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function pingSftp(config: SftpConfig): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneConfig(config);
    try {
        const result = await pingRclone(rclone);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}
