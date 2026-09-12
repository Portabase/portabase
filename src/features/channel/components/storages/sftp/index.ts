import {spawn} from "node:child_process";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

import {SftpConfig} from "@/features/channel/components/storages/sftp/types";
import {RcloneConfig} from "@/features/channel/components/storages/rclone/types";
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

function obscure(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn("rclone", ["obscure", password], {
            stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        let err = "";
        child.stdout!.on("data", (c: Buffer) => (out += c.toString()));
        child.stderr!.on("data", (c: Buffer) => (err += c.toString()));
        child.on("error", reject);
        child.on("close", (code) =>
            code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || `rclone obscure exited ${code}`)),
        );
    });
}


async function toRcloneConfig(
    config: SftpConfig,
): Promise<{rclone: RcloneConfig; cleanup: () => void}> {
    const lines = ["[sftp]", "type = sftp", `host = ${config.host}`];
    if (config.port) lines.push(`port = ${config.port}`);
    lines.push(`user = ${config.username}`);

    let keyDir: string | null = null;

    if (config.privateKey && config.privateKey.trim()) {
        keyDir = await mkdtemp(path.join(tmpdir(), "portabase-sftp-"));
        const keyFile = path.join(keyDir, "id_key");
        await writeFile(keyFile, config.privateKey, {mode: 0o600});
        lines.push(`key_file = ${keyFile}`);
    }

    if (config.password && config.password.trim()) {
        lines.push(`pass = ${await obscure(config.password)}`);
    }

    const cleanup = () => {
        if (keyDir) void rm(keyDir, {recursive: true, force: true});
    };

    return {
        rclone: {
            configText: lines.join("\n") + "\n",
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
    const result = await getRclone(rclone, input);

    const file = result.file as unknown as {on?: (ev: string, cb: () => void) => void} | undefined;
    if (result.success && file?.on) {
        file.on("close", cleanup);
    } else {
        cleanup();
    }
    return {...result, provider: PROVIDER} as unknown as StorageResult;
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
