// import {drive_v3, google} from "googleapis";
// import Drive = drive_v3.Drive;
// import {GoogleDriveConfig} from "@/features/storages/providers/google-drive/types";
//
//
// export async function getGoogleDriveClient(config: GoogleDriveConfig): Promise<Drive> {
//     const auth = new google.auth.JWT({
//         email: config.clientEmail,
//         key: config.privateKey?.replace(/\\n/g, "\n"),
//         scopes: ["https://www.googleapis.com/auth/drive"],
//     });
//
//     return google.drive({
//         version: "v3",
//         auth,
//     });
// }
//
//
// export async function findFileByName(
//     drive: any,
//     name: string,
//     folderId: string
// ): Promise<string | null> {
//     const res = await drive.files.list({
//         q: `name='${name}' and '${folderId}' in parents and trashed=false`,
//         fields: "files(id)",
//         pageSize: 1,
//     });
//
//     return res.data.files?.[0]?.id ?? null;
// }

import {drive_v3, google} from "googleapis";
import {GoogleDriveConfig} from "@/features/storages/providers/google-drive/types";
import Drive = drive_v3.Drive;
import {getServerUrl} from "@/utils/get-server-url";

export async function getGoogleDriveClient(config: GoogleDriveConfig): Promise<Drive> {
    const baseUrl = getServerUrl();

    const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        // config.redirectUri
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
    const res = await drive.files.list({
        q: `name='${name}' and '${folderId}' in parents and trashed=false`,
        fields: "files(id)",
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    });

    return res.data.files?.[0]?.id ?? null;
}