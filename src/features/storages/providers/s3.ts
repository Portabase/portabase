import * as Minio from "minio";
import {StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from "../types";
import {generateFileUrl} from "@/features/storages/helpers";

type S3Config = {
    endPointUrl: string;
    accessKey: string;
    secretKey: string;
    bucketName: string;
    port?: number;
    useSSL?: boolean;
};

async function getS3Client(config: S3Config) {
    return new Minio.Client({
        endPoint: config.endPointUrl,
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        port: config.port ?? 443,
        useSSL: config.useSSL ?? true,
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
    input: { data: StorageUploadInput, metadata?: StorageMetaData  }
): Promise<StorageResult> {
    const client = await getS3Client(config);
    await ensureBucket(config);

    const key = `${BASE_DIR}${input.data.path}`;

    try {
        await client.statObject(config.bucketName, key);
        return {success: false, provider: "s3", error: "File already exists"};
    } catch {
        // continue if not found
    }

    await client.putObject(config.bucketName, key, input.data.file as Buffer);


    if (input.data.url) {
        const url = await generateFileUrl(input);
        if (!url) {
            return {
                success: false,
                provider: "s3",
                response: "Unable to get url file"
            };
        }
        return {
            success: true,
            provider: 's3',
            url: url
        };
    }
    return {
        success: true,
        provider: 's3',
    };


}

export async function getS3(config: S3Config, input: { data: StorageGetInput, metadata: StorageMetaData  }): Promise<StorageResult> {
    const client = await getS3Client(config);

    const key = `${BASE_DIR}${input.data.path}`;
    try {
        await client.statObject(config.bucketName, key);
    } catch {
        return {success: false, provider: "s3", error: "File not found"};
    }

    const presignedUrl = await client.presignedGetObject(config.bucketName, key, 60);

    const fileStream = await client.getObject(config.bucketName, key);
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    return {
        success: true,
        provider: "s3",
        file: buffer,
        url: presignedUrl,
    };
}

export async function deleteS3(config: S3Config, input: { data: StorageDeleteInput, metadata?: StorageMetaData  }): Promise<StorageResult> {
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
