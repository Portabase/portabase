import { z } from "zod";

export const FetchBackupsSchema = z.object({
    databaseId: z.string(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    filter: z.enum(["available", "deleted"]).optional(),
    sorting: z.any().optional(),
});
export type FetchBackupsSchema = z.infer<typeof FetchBackupsSchema>;

export const FetchRestorationsSchema = z.object({
    databaseId: z.string(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    sorting: z.any().optional(),
});
export type FetchRestorationsSchema = z.infer<typeof FetchRestorationsSchema>;
