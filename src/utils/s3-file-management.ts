import * as Minio from "minio";
import {env} from "@/env.mjs";
import internal from "node:stream";
import stream from "node:stream";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {eq} from "drizzle-orm";


async function getS3Client() {
    const settings = await db
        .select()
        .from(drizzleDb.schemas.setting)
        .where(eq(drizzleDb.schemas.setting.name, "system"))
        .then((res) => res[0]);

    if (!settings) {
        throw new Error("S3 settings not found in database.");
    }

    const baseConfig = {
        endPoint: settings.s3EndPointUrl ?? "",
        accessKey: settings.s3AccessKeyId ?? "",
        secretKey: settings.s3SecretAccessKey ?? "",
    };

    return new Minio.Client({
        ...baseConfig,
        port: Number(env.S3_PORT ?? 0),
        useSSL: env.S3_USE_SSL === "true",
    });
}

export async function checkMinioAlive() {
    try {
        console.log("Check MinioAlive");
        const s3Client = await getS3Client();
        const buckets = await s3Client.listBuckets();
        console.log("MinIO is up and running. Buckets:", buckets);
        return {message: true};
    } catch (error) {
        console.error("Error connecting to MinIO:", error);
        return {error: error};
    }
}

export async function createBucketIfNotExists(bucketName: string) {
    const s3Client = await getS3Client();

    const bucketExists = await s3Client.bucketExists(bucketName);
    if (!bucketExists) {
        console.log(`Creating bucket ${bucketName}`);
        await s3Client.makeBucket(bucketName);
    }
}

/**
 * Delete a file from a bucket
 * @param bucketName name of the bucket
 * @param fileName name of the file
 * @returns true if deleted, false if not
 */
export async function deleteFileFromBucket({
                                               bucketName,
                                               fileName,
                                           }: {
    bucketName: string;
    fileName: string;
}): Promise<boolean> {
    const s3Client = await getS3Client();

    try {
        const fileExists = await checkFileExistsInBucket({ bucketName, fileName });

        if (!fileExists) {
            console.warn(`File not found: ${bucketName}/${fileName}`);
            return false;
        }

        await s3Client.removeObject(bucketName, fileName);
        console.log(`Deleted file: ${bucketName}/${fileName}`);
        return true;
    } catch (error: any) {
        console.error("Error deleting file from bucket:", {
            bucketName,
            fileName,
            error: error.message,
        });
        return false;
    }
}


/**
 * Save file in S3 bucket
 * @param bucketName name of the bucket
 * @param fileName name of the file
 * @param file file to save
 */
export async function saveFileInBucket({bucketName, fileName, file}: {
    bucketName: string;
    fileName: string;
    file: Buffer | internal.Readable
}) {
    await checkMinioAlive();
    await createBucketIfNotExists(bucketName);
    const fileExists = await checkFileExistsInBucket({
        bucketName,
        fileName,
    });
    console.log("File exists:", fileExists);
    if (fileExists) {
        throw new Error("File already exists");
    }
    const s3Client = await getS3Client();

    return await s3Client.putObject(bucketName, fileName, file);
}


export async function getObjectFromClient({
                                              bucketName,
                                              fileName,
                                          }: {
    bucketName: string;
    fileName: string;
}): Promise<stream.Readable> {
    const s3 = await getS3Client();
    return await s3.getObject(bucketName, fileName);
}



export async function checkFileExistsInBucket({
                                                  bucketName,
                                                  fileName,
                                              }: {
    bucketName: string;
    fileName: string;
}): Promise<boolean> {
    const s3 = await getS3Client();
    try {
        const stat = await s3.statObject(bucketName, fileName);
        return !!stat;
    } catch (error: any) {
        if (error.code === 'NoSuchKey' || error.message?.includes('not found')) {
            return false;
        }
        return false;
    }
}

/**
 * Generate presigned urls for uploading files to S3
 * @param files files to upload
 * @returns promise with array of presigned urls
 */
export async function createPresignedUrlToUpload({
                                                     bucketName,
                                                     fileName,
                                                     expiry = 60 * 60, // 1 hour
                                                 }: {
    bucketName: string;
    fileName: string;
    expiry?: number;
}) {
    // Create bucket if it doesn't exist
    await createBucketIfNotExists(bucketName);
    const s3Client = await getS3Client();

    return await s3Client.presignedPutObject(bucketName, fileName, expiry);
}

export async function createPublicBucket({bucketName}: { bucketName: string }) {
    const s3Client = await getS3Client();

    try {
        const exists = await s3Client.bucketExists(bucketName);
        if (!exists) {
            await s3Client.makeBucket(bucketName);
            console.log(`Bucket ${bucketName} created successfully.`);
        } else {
            console.log(`Bucket ${bucketName} already exists.`);
        }

        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:GetObject",
                    Resource: `arn:aws:s3:::${bucketName}/*`,
                },
            ],
        };

        await s3Client.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`Bucket ${bucketName} is now public.`);
    } catch (error) {
        console.error("Error creating bucket:", error);
    }
}

/**
 * Generate a presigned URL for downloading a file from a private S3 bucket
 * @param bucketName name of the bucket
 * @param fileName name of the file
 * @param expiry expiry time in seconds (default 1 hour)
 * @returns presigned download URL
 */
export async function createPresignedUrlToDownload({
                                                       bucketName,
                                                       fileName,
                                                       expiry = 60 * 60,
                                                   }: {
    bucketName: string;
    fileName: string;
    expiry?: number;
}) {
    try {
        const s3Client = await getS3Client();

        console.debug("Checking if file exists in bucket:", {bucketName, fileName});

        const fileExists = await checkFileExistsInBucket({bucketName, fileName});

        if (!fileExists) {
            console.warn("File does not exist:", {bucketName, fileName});
            throw new Error("File does not exist in the bucket.");
        }
        const presignedUrl = await s3Client.presignedGetObject(bucketName, fileName, expiry);
        console.debug("Generated pre signed URL:", presignedUrl);
        return {url: presignedUrl};
    } catch (err: any) {
        console.error("Error in createPreSignedUrlToDownload:", {
            bucketName,
            fileName,
            errorMessage: err?.message,
        });
        throw {error: err.message ?? "Unknown error"};
    }
}
