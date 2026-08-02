import {z} from "zod";

const GFSSettingsSchema = z.object({
    hourly: z.number().int().min(0).max(168),
    daily: z.number().int().min(1).max(31),
    weekly: z.number().int().min(0).max(52),
    monthly: z.number().int().min(0).max(120),
    yearly: z.number().int().min(0).max(50),
});

export const RetentionSettingsSchema = z.object({
    type: z.enum(["count", "days", "gfs"]).optional(),
    count: z.number().min(1).max(100),
    days: z.number().min(1).max(3650),
    gfs: GFSSettingsSchema,
});

export type RetentionSettings = z.infer<typeof RetentionSettingsSchema>;