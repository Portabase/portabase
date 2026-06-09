import {Storage} from "@google-cloud/storage";
import {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput
} from '@/features/storages/storages.types';
import {GoogleCloudStorageConfig} from "@/features/channel/storages/google-cloud-storage/types";
import {Readable} from "node:stream";

async function getGoogleCloudStorageClient(config: GoogleCloudStorageConfig) {
    return new Storage({
        projectId: config.projectId,
        credentials: {
            client_email: config.clientEmail,
            // Keys pasted from a service account JSON often arrive with escaped newlines.
            private_key: config.privateKey.replace(/\\n/g, "\n"),
        },
    });
}

const BASE_DIR = "";

async function ensureBucket(config: GoogleCloudStorageConfig) {
    const client = await getGoogleCloudStorageClient(config);
    const [exists] = await client.bucket(config.bucketName).exists();
    if (!exists) throw new Error(`Bucket "${config.bucketName}" does not exist`);
}

export async function uploadGoogleCloudStorage(
    config: GoogleCloudStorageConfig,
    input: { data: StorageUploadInput, metadata?: StorageMetaData }
): Promise<StorageResult> {
    const client = await getGoogleCloudStorageClient(config);
    await ensureBucket(config);

    const key = `${BASE_DIR}${input.data.path}`;
    const file = input.data.file;

    let uploadStream: Readable;
    if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
        uploadStream = Readable.from(file);
    } else if ((file as any).pipe) {
        uploadStream = file as Readable;
    } else {
        return {success: false, provider: "google-cloud-storage", error: "Unsupported file type for streaming upload"};
    }

    try {
        const writeStream = client
            .bucket(config.bucketName)
            .file(key)
            .createWriteStream({contentType: input.data.contentType});

        await new Promise<void>((resolve, reject) => {
            uploadStream
                .pipe(writeStream)
                .on("finish", resolve)
                .on("error", reject);
        });
    } catch (err: any) {
        return {success: false, provider: "google-cloud-storage", error: err.message};
    }

    return {success: true, provider: "google-cloud-storage"};
}

export async function getGoogleCloudStorage(
    config: GoogleCloudStorageConfig,
    input: { data: StorageGetInput, metadata: StorageMetaData }
): Promise<StorageResult> {
    const client = await getGoogleCloudStorageClient(config);
    const key = `${BASE_DIR}${input.data.path}`;
    const file = client.bucket(config.bucketName).file(key);

    const [exists] = await file.exists();
    if (!exists) return {success: false, provider: "google-cloud-storage", error: "File not found"};

    const fileStream = file.createReadStream();

    let signedUrl: string | undefined;
    if (input.data.signedUrl) {
        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + (input.data.expiresInSeconds ?? 60) * 1000,
        });
        signedUrl = url;
    }

    return {
        success: true,
        provider: "google-cloud-storage",
        file: fileStream as unknown as Buffer | Readable,
        url: signedUrl,
    };
}

export async function deleteGoogleCloudStorage(config: GoogleCloudStorageConfig, input: {
    data: StorageDeleteInput,
    metadata?: StorageMetaData
}): Promise<StorageResult> {
    const client = await getGoogleCloudStorageClient(config);
    const key = `${BASE_DIR}${input.data.path}`;

    try {
        await client.bucket(config.bucketName).file(key).delete();
        return {success: true, provider: "google-cloud-storage"};
    } catch (err: any) {
        return {success: false, provider: "google-cloud-storage", error: err.message};
    }
}

export async function pingGoogleCloudStorage(config: GoogleCloudStorageConfig): Promise<StorageResult> {
    try {
        const client = await getGoogleCloudStorageClient(config);
        const bucket = client.bucket(config.bucketName);

        const [exists] = await bucket.exists();
        if (!exists) return {
            success: false,
            provider: "google-cloud-storage",
            response: "Bucket does not exist"
        };

        const key = `${BASE_DIR}ping.txt`;
        const file = bucket.file(key);
        await file.save(Buffer.from("ping"));
        await file.download();
        await file.delete();

        return {
            success: true,
            provider: "google-cloud-storage",
            response: "Google Cloud Storage OK"
        };
    } catch (err: any) {
        return {
            success: false,
            provider: "google-cloud-storage",
            response: err.message
        };
    }
}

export async function copyGoogleCloudStorage(
    config: GoogleCloudStorageConfig,
    input: {
        data: StorageCopyInput,
    },
): Promise<StorageResult> {
    const client = await getGoogleCloudStorageClient(config);
    await ensureBucket(config);

    const sourceKey = `${BASE_DIR}${input.data.from}`;
    const destinationKey = `${BASE_DIR}${input.data.to}`;

    try {
        const bucket = client.bucket(config.bucketName);
        await bucket.file(sourceKey).copy(bucket.file(destinationKey));

        return {
            success: true,
            provider: "google-cloud-storage",
        };
    } catch (err: any) {
        return {
            success: false,
            provider: "google-cloud-storage",
            error: err.message,
        };
    }
}
