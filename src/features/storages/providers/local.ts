"use server"
import {mkdir, writeFile, unlink, readFile} from 'fs/promises';
import path from 'path';
import {StorageDeleteInput, StorageGetInput, StorageResult, StorageUploadInput} from '../types';
import fs from "node:fs";
import {getServerUrl} from "@/utils/get-server-url";

const BASE_DIR = "/private/uploads/files/";

export async function uploadLocal(
    config: { baseDir?: string },
    input: { data: StorageUploadInput }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const fullPath = path.join(process.cwd(), base, input.data.path);

    const dir = path.dirname(fullPath);

    await mkdir(dir, {recursive: true});
    await writeFile(fullPath, input.data.file);

    return {
        success: true,
        provider: 'local',
        url: path.join(fullPath),
    };
}

export async function getLocal(
    config: { baseDir?: string },
    input: { data: StorageGetInput }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const filePath = path.join(process.cwd(), base, input.data.path)
    const fileName = path.basename(input.data.path);

    const file = await readFile(filePath);

    if (!fs.existsSync(filePath)) {
        console.error("File not found at:", filePath);
        return ({
            success: false,
            provider: 'local',
        });
    }
    const crypto = require("crypto");
    const baseUrl = getServerUrl();

    const expiresAt = Date.now() + 60 * 1000;
    const token = crypto.createHash("sha256").update(`${fileName}${expiresAt}`).digest("hex");

    const params = new URLSearchParams({
        path: input.data.path,
        token,
        expires: expiresAt.toString(),
    });


    return {
        success: true,
        provider: 'local',
        file: file,
        url: `${baseUrl}/api/files/?${params.toString()}`,
    };
}

export async function deleteLocal(
    config: { baseDir?: string },
    input: { data: StorageDeleteInput }
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
): Promise<StorageResult>  {

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