"use server"
import {mkdir, writeFile, unlink, readFile} from 'fs/promises';
import path from 'path';
import {StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from '../types';
import fs from "node:fs";
import {getServerUrl} from "@/utils/get-server-url";
import {generateFileUrl} from "@/features/storages/helpers";

const BASE_DIR = "/private/uploads/";

export async function uploadLocal(
    config: { baseDir?: string },
    input: { data: StorageUploadInput, metadata?: StorageMetaData }
): Promise<StorageResult> {
    const base = config.baseDir || BASE_DIR;
    const fullPath = path.join(process.cwd(), base, input.data.path);

    const dir = path.dirname(fullPath);

    await mkdir(dir, {recursive: true});
    await writeFile(fullPath, input.data.file);


    if (input.data.url) {
        const url = await generateFileUrl(input);
        if (!url) {
            return {
                success: false,
                provider: "local",
                response: "Unable to get url file"
            };
        }
        return {
            success: true,
            provider: 'local',
            url: url
        };
    }
    return {
        success: true,
        provider: 'local',
    };



}

export async function getLocal(
    config: { baseDir?: string },
    input: { data: StorageGetInput, metadata: StorageMetaData }
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

    if (input.data.signedUrl) {
        const url = await generateFileUrl(input);

        if (!url) {
            return {
                success: false,
                provider: "local",
                response: "Unable to get url file"
            };
        }

        return {
            success: true,
            provider: "local",
            file: file,
            url: url,
        };
    }

    return {
        success: true,
        provider: "local",
        file: file,
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