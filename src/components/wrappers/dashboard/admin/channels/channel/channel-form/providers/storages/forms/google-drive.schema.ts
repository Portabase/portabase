import {z} from "zod";

export const GoogleDriveChannelConfigSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    folderId: z.string().min(1, "Folder ID is required"),
    refreshToken: z.string().optional(),
});
