import {z} from "zod";

export const DefaultStorageSchema = z.object({
    storageChannelId: z.string().optional().nullable(),
    encryption: z.boolean(),
});

export type DefaultStorageType = z.infer<typeof DefaultStorageSchema>;
