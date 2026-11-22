import {Readable} from "node:stream";
import {
    checkRclone,
    copyRclone,
    deleteRclone,
    getRclone,
    pingRclone,
    uploadRclone,
} from "@/features/channel/components/storages/rclone";
import {toRcloneTarget} from "@/features/channel/components/storages/rclone/target";
import type {WebDavConfig} from "@/features/channel/components/storages/webdav/types";
import type {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput,
} from "@/features/storages/types";

const PROVIDER = "webdav" as const;

export async function uploadWebDav(config: WebDavConfig, input: {data: StorageUploadInput; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await uploadRclone(rclone, input), provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function getWebDav(config: WebDavConfig, input: {data: StorageGetInput; metadata: StorageMetaData}): Promise<StorageResult> {
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

export async function deleteWebDav(config: WebDavConfig, input: {data: StorageDeleteInput; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await deleteRclone(rclone, input), provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function checkWebDav(config: WebDavConfig, input: {data: {path: string}; metadata?: StorageMetaData}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await checkRclone(rclone, input), provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function copyWebDav(config: WebDavConfig, input: {data: StorageCopyInput}): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await copyRclone(rclone, input), provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}

export async function pingWebDav(config: WebDavConfig): Promise<StorageResult> {
    const {rclone, cleanup} = await toRcloneTarget(PROVIDER, config);
    try {
        return {...await pingRclone(rclone), provider: PROVIDER} as unknown as StorageResult;
    } finally {
        cleanup();
    }
}
