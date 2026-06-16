import {z} from "zod";

export const GoogleCloudStorageChannelConfigSchema = z.object({
export const GoogleCloudStorageChannelConfigSchema = z.object({
    projectId: z.string().trim().min(1, "Project ID is required"),
    bucketName: z.string().trim().min(1, "Bucket name is required"),
    clientEmail: z.string().trim().email("Client email must be a valid email"),
    privateKey: z.string().trim().min(1, "Private key is required"),
});
});
