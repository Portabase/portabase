import {Readable} from "node:stream";

import type {FtpConfig} from "./types";
import {toRcloneTarget} from "@/features/channel/components/storages/rclone/target";
import {
    checkRclone,
    copyRclone,
    deleteRclone,
    getRclone,
    pingRclone,
    uploadRclone,
} from "@/features/channel/components/storages/rclone";
import type {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput,
} from "@/features/storages/types";

const PROVIDER = "ftp" as const;

export async function uploadFtp(
    config: FtpConfig,
    input: {data: StorageUploadInput; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await uploadRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function getFtp(
    config: FtpConfig,
    input: {data: StorageGetInput; metadata: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await getRclone(rclone, input);
        const file = result.file instanceof Readable ? result.file : undefined;
        if (result.success && file) {
            file.on("close", cleanup);
        } else {
            cleanup();
        }
        return {...result, provider: PROVIDER};
    } catch (error) {
        cleanup();
        throw error;
    }
}

export async function deleteFtp(
    config: FtpConfig,
    input: {data: StorageDeleteInput; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await deleteRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function checkFtp(
    config: FtpConfig,
    input: {data: {path: string}; metadata?: StorageMetaData},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await checkRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function copyFtp(
    config: FtpConfig,
    input: {data: StorageCopyInput},
): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await copyRclone(rclone, input);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function pingFtp(config: FtpConfig): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget("ftp", config);
    try {
        const result = await pingRclone(rclone);
        return {...result, provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}
