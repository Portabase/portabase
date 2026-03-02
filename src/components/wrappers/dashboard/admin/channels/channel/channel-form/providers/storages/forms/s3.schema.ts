import {z} from "zod";

export const S3ChannelConfigSchema = z.object({
    endPointUrl: z.string().min(1, "Endpoint URL is required"),
    region: z.string().min(1, "Region is required"),
    accessKey: z.string().min(1, "Access Key is required"),
    secretKey: z.string().min(1, "Secret Key is required"),
    bucketName: z.string().min(1, "Bucket name is required"),
    port: z.coerce.number().optional(),
    ssl: z.boolean().optional().default(true),
});
