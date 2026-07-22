import { z } from "zod";

export const S3FormSchema = z.object({
    s3EndPointUrl: z.string(),
    s3AccessKeyId: z.string(),
    s3SecretAccessKey: z.string(),
    S3BucketName: z.string(),
});

export type S3FormType = z.infer<typeof S3FormSchema>;

export const StorageSwitchSchema = z.object({
    storage: z.enum(["local", "s3"]),
});

export type StorageType = z.infer<typeof StorageSwitchSchema>;
