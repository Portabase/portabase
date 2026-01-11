"use server";

import {mkdir, writeFile} from "fs/promises";
import path from "path";
import * as fs from "node:fs";
import {getServerUrl} from "@/utils/get-server-url";
import {createPresignedUrlToDownload, deleteFileFromBucket, saveFileInBucket} from "@/utils/s3-file-management";
import {env} from "@/env.mjs";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {unlink} from "fs/promises";
import {action} from "@/lib/safe-actions/actions";

const privateLocalDir = "private/uploads/files/";
const privateS3Dir = "backups/";

export async function uploadLocalPrivate(fileName: string, buffer: any) {
    try {
        await mkdir(path.join(process.cwd(), privateLocalDir), {recursive: true});
        await writeFile(path.join(process.cwd(), privateLocalDir, fileName), buffer);

        return {
            success: true,
            message: "File uploaded successfully",
            filePath: path.join(privateLocalDir, fileName),
        };
    } catch (error) {
        console.error("Error occurred:", error);
        throw new Error("An error occurred while importing the private file");
    }
}

export async function uploadS3Private(fileName: string, buffer: any, bucketName: string) {
    try {

        await saveFileInBucket({
            bucketName,
            fileName: `${privateS3Dir}${fileName}`,
            file: buffer,
        });

        return {
            success: true,
            filePath: `${privateS3Dir}${fileName}`,
            message: "File uploaded successfully",
        };
    } catch (error) {
        console.error("Error occurred:", error);
        throw new Error("An error occurred while importing the private file");
    }
}


export async function deleteFileS3Private(fileName: string, bucketName: string) {
    try {

        await deleteFileFromBucket({
            bucketName,
            fileName: `${privateS3Dir}${fileName}`,
        });

        return {
            success: true,
            message: "File deleted successfully",
        };
    } catch (error) {
        console.error("Error occurred:", error);
        throw new Error("An error occurred while deleting the private file");
    }
}


/**
 * Delete a file from local private storage
 */
export async function deleteLocalPrivate(fileName: string) {
    try {
        console.log(fileName);
        const filePath = path.join(process.cwd(), privateLocalDir, fileName);
        console.log(`Deleted ${filePath}`);
        // Delete locally
        await unlink(filePath);

        return {
            success: true,
            message: `File '${fileName}' deleted successfully`,
        };
    } catch (error: any) {
        if (error.code === "ENOENT") {
            return {
                success: false,
                message: `File '${fileName}' not found`,
            };
        }

        console.error("Error occurred while deleting file:", error);
        throw new Error("An error occurred while deleting the file");
    }
}


// export async function getFileUrlPresignedLocal(fileName: string) {
//     try {
//         const filePath = path.join(privateLocalDir, fileName);
//         await mkdir(path.join(process.cwd(), privateLocalDir), {recursive: true});
//
//         if (!fs.existsSync(filePath)) {
//             console.error("File not found at:", filePath);
//             return `File not found at: ${filePath}`;
//         }
//         const crypto = require("crypto");
//         const baseUrl = getServerUrl();
//
//         const expiresAt = Date.now() + 60 * 1000; // expires in 1 minute
//         const token = crypto.createHash("sha256").update(`${fileName}${expiresAt}`).digest("hex");
//         return `${baseUrl}/api/files/${fileName}?token=${token}&expires=${expiresAt}`;
//     } catch (error) {
//         throw error;
//     }
// }

export async function getFileUrlPresignedS3(fileName: string) {
    try {
        return await createPresignedUrlToDownload({
            bucketName: env.S3_BUCKET_NAME!,
            fileName: fileName,
        });
    } catch (error) {
        throw error;
    }
}


export const getFileUrlPresignedLocal = action
    .schema(z.object({
        dir: z.string().optional(),
        fileName: z.string()
    }))
    .action(async ({parsedInput}): Promise<ServerActionResult<string>> => {
        try {
            const filePath = path.join(parsedInput.dir ? parsedInput.dir : privateLocalDir, parsedInput.fileName);
            await mkdir(path.join(process.cwd(), privateLocalDir), {recursive: true});

            if (!fs.existsSync(filePath)) {
                console.error("File not found at:", filePath);
                throw new Error(`File not found at: ${filePath}`);
            }
            const crypto = require("crypto");
            const baseUrl = getServerUrl();

            const expiresAt = Date.now() + 60 * 1000; // expires in 1 minute
            const token = crypto.createHash("sha256").update(`${parsedInput.fileName}${expiresAt}`).digest("hex");

            return {
                success: true,
                value: `${baseUrl}/api/files/${parsedInput.fileName}?token=${token}&expires=${expiresAt}`,
                actionSuccess: {
                    message: "Successfully retrieved presigned URL Local",
                    messageParams: {fileName: parsedInput.fileName},
                },
            };
        } catch (error) {

            return {
                success: false,
                actionError: {
                    message: "Failed to generate presigned URL",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {fileName: parsedInput.fileName},
                },
            };
        }
    });


export const getFileUrlPreSignedS3Action = action
    .schema(z.string())
    .action(async ({parsedInput}): Promise<ServerActionResult<string>> => {
        try {
            const data = await createPresignedUrlToDownload({
                bucketName: env.S3_BUCKET_NAME!,
                fileName: parsedInput,
            });

            return {
                success: true,
                value: data.url,
                actionSuccess: {
                    message: "Successfully retrieved presigned URL",
                    messageParams: {fileName: parsedInput},
                },
            };
        } catch (error) {
            const isNotFound = error instanceof Error && error.message.includes("File does not exist");

            const logContext = {
                file: parsedInput,
                reason: error instanceof Error ? error.message : "Unknown",
            };

            console.error("Presigned URL generation failed:", logContext);

            return {
                success: false,
                actionError: {
                    message: isNotFound
                        ? "File not found in S3 bucket"
                        : "Failed to generate presigned URL",
                    status: isNotFound ? 404 : 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {fileName: parsedInput},
                },
            };
        }
    });


