import {drive_v3, google} from "googleapis";
import {GoogleDriveConfig} from "@/features/channel/components/storages/google-drive/types";
import Drive = drive_v3.Drive;
import {getServerUrl} from "@/utils/get-server-url";

export async function getGoogleDriveClient(config: GoogleDriveConfig): Promise<Drive> {
    const baseUrl = getServerUrl();

    const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        baseUrl
    );

    oauth2Client.setCredentials({
        refresh_token: config.refreshToken
    });

    return google.drive({
        version: "v3",
        auth: oauth2Client
    });
}

export async function findFileByName(
    drive: drive_v3.Drive,
    name: string,
    folderId: string
): Promise<string | null> {
    // Drive may return fewer results than pageSize while more remain, so follow
    // nextPageToken until a duplicate is found or the listing is exhausted.
    const files: drive_v3.Schema$File[] = [];
    let pageToken: string | undefined;
    do {
        const res = await drive.files.list({
            q: `name='${name}' and '${folderId}' in parents and trashed=false`,
            fields: "nextPageToken, files(id)",
            pageSize: 2,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        files.push(...(res.data.files ?? []));
        pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && files.length < 2);

    if (files.length > 1) {
        throw new Error(`Multiple files named '${name}' found in the same folder`);
    }

    return files[0]?.id ?? null;
}


export async function ensureFolderPath(client: any, path: string, rootFolderId: string): Promise<string> {
    const parts = path.split("/").filter(Boolean); // ["backups", "project-1"]
    let parentId = rootFolderId;

    for (const part of parts) {
        const res = await client.files.list({
            q: `'${parentId}' in parents and name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        if (res.data.files && res.data.files.length > 0) {
            parentId = res.data.files[0].id!;
        } else {
            const folder = await client.files.create({
                requestBody: {
                    name: part,
                    mimeType: "application/vnd.google-apps.folder",
                    parents: [parentId],
                },
                fields: "id",
                supportsAllDrives: true,
            });
            parentId = folder.data.id!;
        }
    }

    return parentId;
}


export async function resolveFilePath(client: any, fullPath: string, rootFolderId: string): Promise<string | null> {
    const parts = fullPath.split("/").filter(Boolean);
    const fileName = parts.pop()!;
    let parentId = rootFolderId;

    for (const part of parts) {
        const res = await client.files.list({
            q: `'${parentId}' in parents and name='${part}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });
        if (res.data.files && res.data.files.length > 0) {
            parentId = res.data.files[0].id!;
        } else {
            return null;
        }
    }

    const fileRes = await client.files.list({
        q: `'${parentId}' in parents and name='${fileName}' and trashed=false`,
        fields: "files(id, name)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    return fileRes.data.files?.[0]?.id || null;
}