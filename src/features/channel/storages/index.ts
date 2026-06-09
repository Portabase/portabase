import {
    StorageProviderKind,
    StorageInput,
    StorageResult,
} from '@/features/storages/storages.types';

import {uploadLocal, getLocal, deleteLocal, pingLocal, copyLocal} from './local';
import {copyS3, deleteS3, getS3, pingS3, uploadS3} from "@/features/channel/storages/s3";
import {
    copyGoogleDrive,
    deleteGoogleDrive,
    getGoogleDrive,
    pingGoogleDrive,
    uploadGoogleDrive
} from "@/features/channel/storages/google-drive";
import {
    copyGoogleCloudStorage,
    deleteGoogleCloudStorage,
    getGoogleCloudStorage,
    pingGoogleCloudStorage,
    uploadGoogleCloudStorage
} from "@/features/channel/storages/google-cloud-storage";

type ProviderHandler = {
    upload: (config: any, input: StorageInput & { action: 'upload' }) => Promise<StorageResult>;
    get: (config: any, input: StorageInput & { action: 'get' }) => Promise<StorageResult>;
    delete: (config: any, input: StorageInput & { action: 'delete' }) => Promise<StorageResult>;
    ping: (config: any, input: { action: 'ping' }) => Promise<StorageResult>;
    copy: (config: any, input: StorageInput & { action: 'copy' }) => Promise<StorageResult>;
};

const handlers: Record<StorageProviderKind, ProviderHandler> = {
    local: {
        upload: uploadLocal,
        get: getLocal,
        delete: deleteLocal,
        ping: pingLocal,
        copy: copyLocal,
    },
    s3: {
        upload: uploadS3,
        get: getS3,
        delete: deleteS3,
        ping: pingS3,
        copy: copyS3
    },
    "google-drive": {
        upload: uploadGoogleDrive,
        get: getGoogleDrive,
        delete: deleteGoogleDrive,
        ping: pingGoogleDrive,
        copy: copyGoogleDrive,
    },
    "google-cloud-storage": {
        upload: uploadGoogleCloudStorage,
        get: getGoogleCloudStorage,
        delete: deleteGoogleCloudStorage,
        ping: pingGoogleCloudStorage,
        copy: copyGoogleCloudStorage,
    }
};

export async function dispatchViaProvider(
    kind: StorageProviderKind,
    config: any,
    input: StorageInput,
): Promise<StorageResult> {
    const provider = handlers[kind];

    if (!provider) {
        return {
            success: false,
            provider: kind,
            error: `Unsupported storage provider: ${kind}`,
        };
    }

    try {
        return await provider[input.action](config, input as any);
    } catch (err: any) {
        return {
            success: false,
            provider: kind,
            error: err.message || 'Storage provider error',
        };
    }
}
