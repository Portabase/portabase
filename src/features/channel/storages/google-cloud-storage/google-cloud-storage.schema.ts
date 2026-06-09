import {z} from "zod";

export const GoogleCloudStorageChannelConfigSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    bucketName: z.string().min(1, "Bucket name is required"),
    clientEmail: z.string().min(1, "Client email is required"),
    privateKey: z.string().min(1, "Private key is required"),
});
