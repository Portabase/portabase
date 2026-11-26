import {Readable} from "node:stream";

import type {SmbConfig} from "./types";
import {toRcloneTarget} from "@/features/channel/components/storages/rclone/target";
import {checkRclone, copyRclone, deleteRclone, getRclone, pingRclone, uploadRclone} from "@/features/channel/components/storages/rclone";
import type {StorageCopyInput, StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from "@/features/storages/types";

const PROVIDER = "smb" as const;

export async function uploadSmb(config: SmbConfig, input: {data: StorageUploadInput; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await uploadRclone(rclone, input), provider: PROVIDER} as StorageResult;
    } finally {
        cleanup();
    }
}

export async function getSmb(config: SmbConfig, input: {data: StorageGetInput; metadata: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        const result = await getRclone(rclone, input);
        const file = result.file instanceof Readable ? result.file : undefined;
        if (result.success && file) file.on("close", cleanup);
        else cleanup();
        return {...result, provider: PROVIDER};
    } catch (error) {
        cleanup();
        throw error;
    }
}

export async function deleteSmb(config: SmbConfig, input: {data: StorageDeleteInput; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await deleteRclone(rclone, input), provider: PROVIDER} as StorageResult;
    } finally {
        cleanup();
    }
}

export async function checkSmb(config: SmbConfig, input: {data: {path: string}; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await checkRclone(rclone, input), provider: PROVIDER} as StorageResult;
    } finally {
        cleanup();
    }
}

export async function copySmb(config: SmbConfig, input: {data: StorageCopyInput}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await copyRclone(rclone, input), provider: PROVIDER} as StorageResult;
    } finally {
        cleanup();
    }
}

export async function pingSmb(config: SmbConfig): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await pingRclone(rclone), provider: PROVIDER} as StorageResult;
    } finally {
        cleanup();
    }
}
