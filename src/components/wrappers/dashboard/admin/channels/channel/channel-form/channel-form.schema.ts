import {z} from "zod";


export const ChannelFormSchema = z.object({
    name: z
        .string()
        .min(5, "Name must be at least 5 characters long")
        .max(40, "Name must be at most 40 characters long"),
    config: z.record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])).optional(),
    enabled: z.boolean().default(true),
});


export const NotificationChannelFormSchema = ChannelFormSchema.extend({
    provider: z.enum(
        ["slack", "smtp", "discord", "telegram", "gotify", "ntfy", "webhook"],
        {required_error: "Provider is required"}
    ),
});

export const StorageChannelFormSchema = ChannelFormSchema.extend({
    provider: z.enum(["local", "s3", "google-drive"], {required_error: "Provider is required"}),
});


export type NotificationChannelFormType = z.infer<typeof NotificationChannelFormSchema>;
export type StorageChannelFormType = z.infer<typeof StorageChannelFormSchema>;
