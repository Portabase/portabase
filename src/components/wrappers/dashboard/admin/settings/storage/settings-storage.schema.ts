import {z} from "zod";

export const DefaultStorageSchema = z.object({
    storageChannelId: z.string(),
    encryption: z.boolean(),
});

export type DefaultStorageType = z.infer<typeof DefaultStorageSchema>;
