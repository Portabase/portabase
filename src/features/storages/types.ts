export type StorageProviderKind =
    | 'local'
    | 's3'
    | 'google-drive'
    ;

export type StorageAction =
    | 'upload'
    | 'get'
    | 'delete';

export interface StorageUploadInput {
    path: string;
    file: Buffer | Uint8Array;
    contentType?: string;
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
    | { action: 'upload'; data: StorageUploadInput }
    | { action: 'get'; data: StorageGetInput }
    | { action: 'delete'; data: StorageDeleteInput }
    | { action: 'ping'; };

export interface StorageResult {
    success: boolean;
    provider: StorageProviderKind | null;
    url?: string;
    file?: Buffer;
    error?: string;
    response?: any;
}
