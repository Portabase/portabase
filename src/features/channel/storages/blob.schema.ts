import {z} from "zod";

export const BlobChannelConfigSchema = z.object({
    accountName: z.string().min(1, "Account name is required"),
    accountKey: z.string().optional(),
    connectionString: z.string().optional(),
    containerName: z.string().min(1, "Container name is required"),
    endpointUrl: z.string().optional(),
}).refine(
    (data) => data.accountKey || data.connectionString,
    {message: "Either account key or connection string is required"}
);
