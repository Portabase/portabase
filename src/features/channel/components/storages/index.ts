import {
    StorageProviderKind,
    StorageInput,
    StorageResult,
} from '@/features/storages/types';

import {uploadLocal, getLocal, deleteLocal, pingLocal, copyLocal, checkLocal} from './local';
import {copyS3, deleteS3, getS3, pingS3, uploadS3, checkS3} from "@/features/channel/components/storages/s3";
import {
    copyBlob,
    deleteBlob,
    getBlob,
    pingBlob,
    uploadBlob,
    checkBlob
} from "@/features/channel/components/storages/az-blob";
import {
    copyGoogleDrive,
    deleteGoogleDrive,
    getGoogleDrive,
    pingGoogleDrive,
    uploadGoogleDrive,
    checkGoogleDrive
} from "@/features/channel/components/storages/google-drive";
import {
    copyGoogleCloudStorage,
    deleteGoogleCloudStorage,
    getGoogleCloudStorage,
    pingGoogleCloudStorage,
    uploadGoogleCloudStorage,
    checkGoogleCloudStorage
} from "@/features/channel/components/storages/google-cloud-storage";
import {
    checkRclone,
    copyRclone,
    deleteRclone,
    getRclone,
    pingRclone,
    uploadRclone
} from "@/features/channel/components/storages/rclone";
import {validateRcloneConfig} from "@/features/channel/components/storages/rclone/rclone.parse";
import {
    checkSftp,
    copySftp,
    deleteSftp,
    getSftp,
    pingSftp,
    uploadSftp,
} from "@/features/channel/components/storages/sftp";
import {
    checkWebDav,
    copyWebDav,
    deleteWebDav,
    getWebDav,
    pingWebDav,
    uploadWebDav,
} from "@/features/channel/components/storages/webdav";
import {checkFtp, copyFtp, deleteFtp, getFtp, pingFtp, uploadFtp} from "@/features/channel/components/storages/ftp";
import {checkSmb, copySmb, deleteSmb, getSmb, pingSmb, uploadSmb} from "@/features/channel/components/storages/smb";

type ProviderHandler = {
    upload: (config: any, input: StorageInput & { action: 'upload' }) => Promise<StorageResult>;
    get: (config: any, input: StorageInput & { action: 'get' }) => Promise<StorageResult>;
    delete: (config: any, input: StorageInput & { action: 'delete' }) => Promise<StorageResult>;
    ping: (config: any, input: { action: 'ping' }) => Promise<StorageResult>;
    copy: (config: any, input: StorageInput & { action: 'copy' }) => Promise<StorageResult>;
    check: (config: any, input: StorageInput & { action: 'check' }) => Promise<StorageResult>;
};

const handlers: Record<StorageProviderKind, ProviderHandler> = {
    local: {
        upload: uploadLocal,
        get: getLocal,
        delete: deleteLocal,
        ping: pingLocal,
        copy: copyLocal,
        check: checkLocal,
    },
    s3: {
        upload: uploadS3,
        get: getS3,
        delete: deleteS3,
        ping: pingS3,
        copy: copyS3,
        check: checkS3,
    },
    "google-drive": {
        upload: uploadGoogleDrive,
        get: getGoogleDrive,
        delete: deleteGoogleDrive,
        ping: pingGoogleDrive,
        copy: copyGoogleDrive,
        check: checkGoogleDrive,
    },
    blob: {
        upload: uploadBlob,
        get: getBlob,
        delete: deleteBlob,
        ping: pingBlob,
        copy: copyBlob,
        check: checkBlob,
    },
    "google-cloud-storage": {
        upload: uploadGoogleCloudStorage,
        get: getGoogleCloudStorage,
        delete: deleteGoogleCloudStorage,
        ping: pingGoogleCloudStorage,
        copy: copyGoogleCloudStorage,
        check: checkGoogleCloudStorage,
    },
    rclone: {
        upload: uploadRclone,
        get: getRclone,
        delete: deleteRclone,
        ping: pingRclone,
        copy: copyRclone,
        check: checkRclone,
    },
    sftp: {
        upload: uploadSftp,
        get: getSftp,
        delete: deleteSftp,
        ping: pingSftp,
        copy: copySftp,
        check: checkSftp,
    },
    webdav: {
        upload: uploadWebDav,
        get: getWebDav,
        delete: deleteWebDav,
        ping: pingWebDav,
        copy: copyWebDav,
        check: checkWebDav,
    },
    ftp: {upload: uploadFtp, get: getFtp, delete: deleteFtp, ping: pingFtp, copy: copyFtp, check: checkFtp},
    smb: {
        upload: uploadSmb,
        get: getSmb,
        delete: deleteSmb,
        ping: pingSmb,
        copy: copySmb,
        check: checkSmb,
    },
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
        if (kind === 'rclone') {
            const error = validateRcloneConfig(config?.configText ?? '', config?.remoteName ?? '');
            if (error) {
                return {success: false, provider: kind, error};
            }
        }

        return await provider[input.action](config, input as any);
    } catch (err: any) {
        return {
            success: false,
            provider: kind,
            error: err.message || 'Storage provider error',
        };
    }
}
