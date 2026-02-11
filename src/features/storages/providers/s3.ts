import * as Minio from "minio";
import {StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from "../types";
import {Readable} from "node:stream";

type S3Config = {
    endPointUrl: string;
    region?: string;
    accessKey: string;
    secretKey: string;
    bucketName: string;
    port?: number;
    ssl?: boolean;
};

async function getS3Client(config: S3Config) {
    return new Minio.Client({
        endPoint: config.endPointUrl,
        region: config.region ?? "us-east-1",
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        port: config.port ?? 443,
        useSSL: config.ssl ?? true,
    });
}

const BASE_DIR = "";


async function ensureBucket(config: S3Config) {
    const client = await getS3Client(config);
    const exists = await client.bucketExists(config.bucketName);
    if (!exists) await client.makeBucket(config.bucketName);
}

export async function uploadS3(
    config: S3Config,
    input: { data: StorageUploadInput, metadata?: StorageMetaData }
): Promise<StorageResult> {
    const client = await getS3Client(config);
    await ensureBucket(config);

    const key = `${BASE_DIR}${input.data.path}`;
    const file = input.data.file;

    let uploadStream: Readable;
    if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
        uploadStream = Readable.from(file);
    } else if ((file as any).pipe) {
        uploadStream = file;
    } else {
        return {success: false, provider: "s3", error: "Unsupported file type for streaming upload"};
    }

    try {
        const result = await client.putObject(config.bucketName, key, uploadStream, input.data.size);
    } catch (err: any) {
        return {success: false, provider: "s3", error: err.message};
    }

    return {success: true, provider: "s3"};
}


export async function getS3(
    config: S3Config,
    input: { data: StorageGetInput, metadata: StorageMetaData }
): Promise<StorageResult> {
    const client = await getS3Client(config);
    const key = `${BASE_DIR}${input.data.path}`;

    try {
        await client.statObject(config.bucketName, key);
    } catch {
        return {success: false, provider: "s3", error: "File not found"};
    }

    const fileStream = await client.getObject(config.bucketName, key);

    let presignedUrl: string | undefined;
    if (input.data.signedUrl) {
        presignedUrl = await client.presignedGetObject(config.bucketName, key, input.data.expiresInSeconds ?? 60);
    }

    return {
        success: true,
        provider: "s3",
        file: fileStream as unknown as Buffer | Readable,
        url: presignedUrl,
    };
}


export async function deleteS3(config: S3Config, input: {
    data: StorageDeleteInput,
    metadata?: StorageMetaData
}): Promise<StorageResult> {
    const client = await getS3Client(config);
    const key = `${BASE_DIR}${input.data.path}`;

    try {
        await client.removeObject(config.bucketName, key);
        return {success: true, provider: "s3"};
    } catch (err: any) {
        return {success: false, provider: "s3", error: err.message};
    }
}

export async function pingS3(config: S3Config): Promise<StorageResult> {
    try {
        const client = await getS3Client(config);
        const exists = await client.bucketExists(config.bucketName);
        if (!exists) return {
            success: false,
            provider: "s3",
            response: "Bucket does not exist"
        };
        const key = `${BASE_DIR}ping.txt`;
        await client.putObject(config.bucketName, key, Buffer.from("ping"));
        await client.getObject(config.bucketName, key);
        await client.removeObject(config.bucketName, key);

        return {
            success: true,
            provider: "s3",
            response: "S3 storage OK"
        };
    } catch (err: any) {
        return {
            success: false,
            provider: "s3",
            response: err.message
        };
    }
}
