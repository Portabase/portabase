import { z } from "zod";
import { statusEnum } from "@/db/schema/types";

export const FetchBackupsSchema = z.object({
    databaseId: z.string(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    state: z.array(z.enum(["available", "deleted"])).optional(),
    stateOperator: z.enum(["is", "is_not"]).optional(),
    status: z.array(z.enum(statusEnum.enumValues)).optional(),
    statusOperator: z.enum(["is", "is_not"]).optional(),
    sorting: z.any().optional(),
});
export type FetchBackupsSchema = z.infer<typeof FetchBackupsSchema>;

export const FetchRestorationsSchema = z.object({
    databaseId: z.string(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    restorationStatus: z.array(z.enum(statusEnum.enumValues)).optional(),
    restorationStatusOperator: z.enum(["is", "is_not"]).optional(),
    sorting: z.any().optional(),
});
export type FetchRestorationsSchema = z.infer<typeof FetchRestorationsSchema>;
