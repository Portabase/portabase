import {z} from "zod";

const GFSSettingsSchema = z.object({
    daily: z.number().min(1).max(31),
    weekly: z.number().min(0).max(52),
    monthly: z.number().min(0).max(120),
    yearly: z.number().min(0).max(50),
});

export const RetentionSettingsSchema = z.object({
    type: z.enum(["count", "days", "gfs"]).optional(),
    count: z.number().min(1).max(100),
    days: z.number().min(1).max(3650),
    gfs: GFSSettingsSchema,
});

export type RetentionSettings = z.infer<typeof RetentionSettingsSchema>;