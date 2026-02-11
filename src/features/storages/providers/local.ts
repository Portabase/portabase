"use server"
import {mkdir, unlink} from 'fs/promises';
import path from 'path';
import {StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from '../types';
import fs from "node:fs";
import {generateFileUrl} from "@/features/storages/helpers";
import {Readable} from "node:stream";

const BASE_DIR = "/private/uploads/";

export async function uploadLocal(
    config: { baseDir?: string },
    input: { data: StorageUploadInput; metadata?: StorageMetaData }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const fullPath = path.join(process.cwd(), base, input.data.path);
    const dir = path.dirname(fullPath);

    await mkdir(dir, { recursive: true });

    try {
        const file = input.data.file;
        if (Buffer.isBuffer(file)) {
            await fs.promises.writeFile(fullPath, input.data.file);
        } else if (file instanceof Readable) {
            await new Promise<void>((resolve, reject) => {
                const writable = fs.createWriteStream(fullPath);
                file.pipe(writable);
                writable.on("finish", resolve);
                writable.on("error", reject);
            });
        } else {
            return { success: false, provider: "local", error: "Unsupported file type. Must be Buffer or ReadableStream" };
        }

        if (input.data.url) {
            const url = await generateFileUrl(input);
            if (!url) {
                return { success: false, provider: "local", response: "Unable to get URL" };
            }
            return { success: true, provider: "local", url };
        }

        return { success: true, provider: "local" };
    } catch (err: any) {
        try { await unlink(fullPath); } catch {}
        return { success: false, provider: "local", error: err.message || "Upload failed" };
    }
}

export async function getLocal(
    config: { baseDir?: string },
    input: { data: StorageGetInput; metadata: StorageMetaData }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const filePath = path.join(process.cwd(), base, input.data.path);

    if (!fs.existsSync(filePath)) {
        console.error("File not found at:", filePath);
        return {
            success: false,
            provider: "local",
            error: "File not found",
        };
    }

    let fileStream: fs.ReadStream | undefined;

    try {
        fileStream = fs.createReadStream(filePath);
    } catch (err: any) {
        console.error("Error creating read stream:", err);
        return {
            success: false,
            provider: "local",
            error: err.message,
        };
    }

    if (input.data.signedUrl) {
        const url = await generateFileUrl(input);
        if (!url) {
            return {
                success: false,
                provider: "local",
                error: "Unable to generate signed URL",
            };
        }

        return {
            success: true,
            provider: "local",
            file: fileStream,
            url,
        };
    }

    return {
        success: true,
        provider: "local",
        file: fileStream,
    };
}



export async function deleteLocal(
    config: { baseDir?: string },
    input: { data: StorageDeleteInput, metadata?: StorageMetaData }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const fullPath = path.join(process.cwd(), base, input.data.path);
    await unlink(fullPath);
    return {
        success: true,
        provider: 'local',
    };
}

export async function pingLocal(
    config: { baseDir?: string }
): Promise<StorageResult> {

    const base = config.baseDir || BASE_DIR;
    const fullPath = path.join(process.cwd(), base, "ping.txt");

    await fs.promises.writeFile(fullPath, "ping");
    await fs.promises.readFile(fullPath);
    await fs.promises.unlink(fullPath);
    return {
        success: true,
        provider: 'local',
        response: "Local storage OK"
    };

}