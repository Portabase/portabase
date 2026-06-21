import {BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential} from "@azure/storage-blob";
import {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput
} from '@/features/storages/storages.types';
import {Readable} from "node:stream";

type BlobConfig = {
    accountName: string;
    accountKey?: string;
    connectionString?: string;
    containerName: string;
    endpointUrl?: string;
};

async function getBlobClient(config: BlobConfig) {
    if (config.connectionString) {
        return BlobServiceClient.fromConnectionString(config.connectionString);
    }

    const url = config.endpointUrl ?? `https://${config.accountName}.blob.core.windows.net`;
    const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey!);
    return new BlobServiceClient(url, credential);
}

const BASE_DIR = "";


async function ensureContainer(config: BlobConfig) {
    const client = await getBlobClient(config);
    const containerClient = client.getContainerClient(config.containerName);
    await containerClient.createIfNotExists();
}

export async function uploadBlob(
    config: BlobConfig,
    input: { data: StorageUploadInput, metadata?: StorageMetaData }
): Promise<StorageResult> {
    const client = await getBlobClient(config);
    await ensureContainer(config);

    const key = `${BASE_DIR}${input.data.path}`;
    const file = input.data.file;

    let uploadStream: Readable;
    if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
        uploadStream = Readable.from(file);
    } else if ((file as any).pipe) {
        uploadStream = file;
    } else {
        return {success: false, provider: "blob", error: "Unsupported file type for streaming upload"};
    }

    try {
        const containerClient = client.getContainerClient(config.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);
        await blockBlobClient.uploadStream(uploadStream);
    } catch (err: any) {
        return {success: false, provider: "blob", error: err.message};
    }

    return {success: true, provider: "blob"};
}


export async function getBlob(
    config: BlobConfig,
    input: { data: StorageGetInput, metadata: StorageMetaData }
): Promise<StorageResult> {
    const client = await getBlobClient(config);
    const key = `${BASE_DIR}${input.data.path}`;

    const containerClient = client.getContainerClient(config.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    if (!(await blockBlobClient.exists())) {
        return {success: false, provider: "blob", error: "File not found"};
    }

    const downloadResponse = await blockBlobClient.download();
    const fileStream = downloadResponse.readableStreamBody as unknown as Readable;

    let presignedUrl: string | undefined;
    if (input.data.signedUrl) {
        presignedUrl = await blockBlobClient.generateSasUrl({
            expiresOn: new Date(Date.now() + (input.data.expiresInSeconds ?? 60) * 1000),
            permissions: BlobSASPermissions.parse("r"),
        });
    }

    return {
        success: true,
        provider: "blob",
        file: fileStream,
        url: presignedUrl,
    };
}


export async function deleteBlob(config: BlobConfig, input: {
    data: StorageDeleteInput,
    metadata?: StorageMetaData
}): Promise<StorageResult> {
    const client = await getBlobClient(config);
    const key = `${BASE_DIR}${input.data.path}`;

    try {
        const containerClient = client.getContainerClient(config.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(key);
        await blockBlobClient.delete();
        return {success: true, provider: "blob"};
    } catch (err: any) {
        return {success: false, provider: "blob", error: err.message};
    }
}

export async function pingBlob(config: BlobConfig): Promise<StorageResult> {
    try {
        const client = await getBlobClient(config);
        const containerClient = client.getContainerClient(config.containerName);
        const exists = await containerClient.exists();
        if (!exists) return {
            success: false,
            provider: "blob",
            response: "Container does not exist"
        };
        const key = `${BASE_DIR}ping-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(key);
        try {
            await blockBlobClient.upload(Buffer.from("ping"), 4);
            await blockBlobClient.download();
        } finally {
            await blockBlobClient.delete().catch(() => undefined);
        }

        return {
            success: true,
            provider: "blob",
            response: "Blob storage OK"
        };
    } catch (err: any) {
        return {
            success: false,
            provider: "blob",
            response: err.message
        };
    }
}


export async function copyBlob(
    config: BlobConfig,
    input: {
        data: StorageCopyInput,
    },
): Promise<StorageResult> {
    const client = await getBlobClient(config);
    await ensureContainer(config);

    const sourceKey = `${BASE_DIR}${input.data.from}`;
    const destinationKey = `${BASE_DIR}${input.data.to}`;

    try {
        const containerClient = client.getContainerClient(config.containerName);
        const sourceBlob = containerClient.getBlockBlobClient(sourceKey);
        const destBlob = containerClient.getBlockBlobClient(destinationKey);
        const poller = await destBlob.beginCopyFromURL(sourceBlob.url);
        await poller.pollUntilDone();

        return {
            success: true,
            provider: "blob",
        };
    } catch (err: any) {
        return {
            success: false,
            provider: "blob",
            error: err.message,
        };
    }
}