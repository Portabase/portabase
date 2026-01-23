"use server"
import {StorageDeleteInput, StorageGetInput, StorageResult, StorageUploadInput} from '../../types';
import {GoogleDriveConfig} from "@/features/storages/providers/google-drive/types";
import {findFileByName, getGoogleDriveClient} from "@/features/storages/providers/google-drive/helpers";
import {Readable} from "node:stream";


// export async function uploadGoogleDrive(
//     config: GoogleDriveConfig,
//     input: { data: StorageUploadInput }
// ): Promise<StorageResult> {
//     const client = await getGoogleDriveClient(config);
//
//     const name = input.data.path;
//
//     const existing = await findFileByName(client, name, config.folderId);
//     if (existing) {
//         return {
//             success: false,
//             provider: "google-drive",
//             error: "File already exists"
//         };
//     }
//
//     await client.files.create({
//         requestBody: {
//             name,
//             parents: [config.folderId],
//         },
//         media: {
//             body: input.data.file as Buffer,
//         },
//     });
//
//
//     return {
//         success: true,
//         provider: 'google-drive',
//     };
// }
//
// export async function getGoogleDrive(
//     config: GoogleDriveConfig,
//     input: { data: StorageGetInput }
// ): Promise<StorageResult> {
//     const client = await getGoogleDriveClient(config);
//     const name = input.data.path;
//
//     const fileId = await findFileByName(client, name, config.folderId);
//     if (!fileId) {
//         return {success: false, provider: "google-drive", error: "File not found"};
//     }
//
//     const res = await client.files.get(
//         {fileId, alt: "media"},
//         {responseType: "arraybuffer"}
//     );
//
//     return {
//         success: true,
//         provider: "google-drive",
//         file: Buffer.from(res.data as ArrayBuffer),
//     };
// }
//
//
// export async function deleteGoogleDrive(
//     config: GoogleDriveConfig,
//     input: { data: StorageDeleteInput }
// ): Promise<StorageResult> {
//     const client = await getGoogleDriveClient(config);
//     const name = input.data.path;
//
//     const fileId = await findFileByName(client, name, config.folderId);
//     if (!fileId) {
//         return {success: false, provider: "google-drive", error: "File not found"};
//     }
//
//     await client.files.delete({fileId});
//
//     return {
//         success: true,
//         provider: "google-drive"
//     };
// }
//
//
// export async function pingGoogleDrive(config: GoogleDriveConfig): Promise<StorageResult> {
//     try {
//         const drive = await getGoogleDriveClient(config);
//         const name = `ping-${Date.now()}.txt`;
//
//         const buffer = Buffer.from("ping");
//
//         const file = await drive.files.create({
//             requestBody: {
//                 name,
//                 parents: [config.folderId],
//             },
//             media: {
//                 mimeType: "text/plain",
//                 body: Readable.from(buffer),
//             },
//             fields: "id",
//         });
//         console.log(file)
//
//         await drive.files.get({fileId: file.data.id!});
//         await drive.files.delete({fileId: file.data.id!});
//
//         return {
//             success: true,
//             provider: "google-drive",
//             response: "Google Drive storage OK",
//         };
//     } catch (err: any) {
//         return {
//             success: false,
//             provider: "google-drive",
//             response: err.message,
//         };
//     }
// }
export async function uploadGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageUploadInput }
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);
    const name = input.data.path;

    const existing = await findFileByName(client, name, config.folderId);
    if (existing) return {success: false, provider: "google-drive", error: "File already exists"};

    await client.files.create({
        requestBody: {name, parents: [config.folderId]},
        media: {body: Readable.from(input.data.file as Buffer)},
        fields: "id",
        supportsAllDrives: true,
    });

    return {success: true, provider: 'google-drive'};
}

export async function getGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageGetInput }
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);
    const name = input.data.path;

    const fileId = await findFileByName(client, name, config.folderId);
    if (!fileId) return {success: false, provider: "google-drive", error: "File not found"};

    const res = await client.files.get(
        {fileId, alt: "media", supportsAllDrives: true},
        {responseType: "arraybuffer"}
    );

    return {
        success: true,
        provider: "google-drive",
        file: Buffer.from(res.data as ArrayBuffer),
    };
}

export async function deleteGoogleDrive(
    config: GoogleDriveConfig,
    input: { data: StorageDeleteInput }
): Promise<StorageResult> {
    const client = await getGoogleDriveClient(config);
    const name = input.data.path;

    const fileId = await findFileByName(client, name, config.folderId);
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
        // await drive.files.delete({fileId: file.data.id!, supportsAllDrives: true});

        return {success: true, provider: "google-drive", response: "Google Drive storage OK"};
    } catch (err: any) {
        return {success: false, provider: "google-drive", response: err.message};
    }
}