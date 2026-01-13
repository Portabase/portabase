import type {
    StorageProviderKind,
    StorageInput,
    StorageResult,
} from '../types';

import {uploadLocal, getLocal, deleteLocal} from './local';

type ProviderHandler = {
    upload: (config: any, input: StorageInput & { action: 'upload' }) => Promise<StorageResult>;
    get: (config: any, input: StorageInput & { action: 'get' }) => Promise<StorageResult>;
    delete: (config: any, input: StorageInput & { action: 'delete' }) => Promise<StorageResult>;
};

const handlers: Record<StorageProviderKind, ProviderHandler> = {
    local: {
        upload: uploadLocal,
        get: getLocal,
        delete: deleteLocal,
    },
    // s3: {
    //     upload: uploadS3,
    //     get: getS3,
    //     delete: deleteS3,
    // },
    // gcs: null as any,
    // azure: null as any,
};

export async function dispatchViaProvider(
    kind: StorageProviderKind,
    config: any,
    input: StorageInput
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
