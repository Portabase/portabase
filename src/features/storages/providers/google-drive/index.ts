"use server"
import {StorageDeleteInput, StorageGetInput, StorageMetaData, StorageResult, StorageUploadInput} from '../../types';
import {GoogleDriveConfig} from "@/features/storages/providers/google-drive/types";
import {
    ensureFolderPath,
    findFileByName,
    getGoogleDriveClient, resolveFilePath
} from "@/features/storages/providers/google-drive/helpers";
import {Readable} from "node:stream";
import {generateFileUrl} from "@/features/storages/helpers";

export async function uploadGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageUploadInput, metadata?: StorageMetaData },
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);

    const fullPath = input.data.path;
    const pathParts = fullPath.split("/").filter(Boolean);
    const fileName = pathParts.pop()!;
    const folderPath = pathParts.join("/");

    const folderId = folderPath
        ? await ensureFolderPath(client, folderPath, config.folderId)
        : config.folderId;

    const existing = await findFileByName(client, fileName, folderId);
    if (existing) return {success: false, provider: "google-drive", error: "File already exists"};

    let fileStream: Readable;
    const file = input.data.file;
    if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
        fileStream = Readable.from(file);
    } else if ((file as any).pipe) {
        fileStream = file as Readable;
    } else {
        throw new Error("Unsupported file type for streaming upload");
    }

    await client.files.create({
        requestBody: {name: fileName, parents: [folderId]},
        media: {body: fileStream},
        fields: "id",
        supportsAllDrives: true,
    });


    if (input.data.url) {
        const url = await generateFileUrl(input);
        if (!url) {
            return {
                success: false,
                provider: "google-drive",
                response: "Unable to get url file"
            };
        }
        return {
            success: true,
            provider: 'google-drive',
            url: url
        };
    }
    return {
        success: true,
        provider: 'google-drive',
    };


}

export async function getGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageGetInput, metadata: StorageMetaData },
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);

    const fileId = await resolveFilePath(client, input.data.path, config.folderId);
    if (!fileId) return {success: false, provider: "google-drive", error: "File not found"};

    const res = await client.files.get(
        {fileId, alt: "media", supportsAllDrives: true},
        {responseType: "stream"}
    );

    const stream = res.data as Readable;


    if (input.data.signedUrl) {
        const url = await generateFileUrl(input);

        if (!url) {
            return {
                success: false,
                provider: "google-drive",
                response: "Unable to get url"
            };
        }

        return {
            success: true,
            provider: "google-drive",
            file: stream,
            url: url,
        };
    }

    return {
        success: true,
        provider: "google-drive",
        file: stream,
    };
}

export async function deleteGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageDeleteInput, metadata?: StorageMetaData },
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);
    const fileId = await resolveFilePath(client, input.data.path, config.folderId);
    if (!fileId) return {success: false, provider: "google-drive", error: "File not found"};

    await client.files.delete({fileId, supportsAllDrives: true});

    return {success: true, provider: "google-drive"};
}

export async function pingGoogleDrive(config: GoogleDriveConfig): Promise<StorageResult> {
    try {
        const drive = await getGoogleDriveClient(config);
        const name = `ping-${Date.now()}.txt`;
        const buffer = Buffer.from("ping");

        const file = await drive.files.create({
            requestBody: {name, parents: [config.folderId]},
            media: {mimeType: "text/plain", body: Readable.from(buffer)},
            fields: "id",
            supportsAllDrives: true,
        });

        await drive.files.get({fileId: file.data.id!, supportsAllDrives: true});
        await drive.files.delete({fileId: file.data.id!, supportsAllDrives: true});

        return {success: true, provider: "google-drive", response: "Google Drive storage OK"};
    } catch (err: any) {
        return {success: false, provider: "google-drive", response: err.message};
    }
}