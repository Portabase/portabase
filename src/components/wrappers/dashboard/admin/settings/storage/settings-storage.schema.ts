import { z } from "zod";

export const DefaultStorageSchema = z.object({
    storageChannelId: z.string(),
});

export type DefaultStorageType = z.infer<typeof DefaultStorageSchema>;
