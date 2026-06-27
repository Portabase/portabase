import {z} from "zod";

export const GoogleCloudStorageChannelConfigSchema = z.object({
    projectId: z.string().trim().min(1, "Project ID is required"),
    bucketName: z.string().trim().min(1, "Bucket name is required"),
    clientEmail: z.email("Client email must be a valid email").trim(),
    privateKey: z.string().trim().min(1, "Private key is required"),
    apiEndpoint: z.preprocess(
        (v) => (v === "" ? undefined : v),
        z.string().url("Endpoint URL must be a valid URL").optional(),
    ),
});
