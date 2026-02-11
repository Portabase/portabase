import {Readable} from "node:stream";

export type StorageProviderKind =
    | 'local'
    | 's3'
    | 'google-drive'
    ;

export type StorageAction =
    | 'upload'
    | 'get'
    | 'delete';

export type StorageFileKind =
    | 'backups'
    | 'images'

export type StorageMetaData = {
    storageId: string,
    fileKind: StorageFileKind
}

export interface StorageUploadInput {
    path: string;
    file: Readable | Buffer | Uint8Array;
    url?: boolean;
    contentType?: string;
    size?: number;
}

export interface StorageGetInput {
    path: string;
    signedUrl?: boolean;
    expiresInSeconds?: number;
}

export interface StorageDeleteInput {
    path: string;
}

export type StorageInput =
    | { action: 'upload'; data: StorageUploadInput, metadata?: StorageMetaData }
    | { action: 'get'; data: StorageGetInput, metadata: StorageMetaData }
    | { action: 'delete'; data: StorageDeleteInput, metadata?: StorageMetaData }
    | { action: 'ping'; };

export interface StorageResult {
    success: boolean;
    provider: StorageProviderKind | null;
    url?: string;
    file?: Buffer | Readable;
    error?: string;
    response?: any;
}
