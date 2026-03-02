import {z} from "zod";

export const NtfyChannelConfigSchema = z.object({
    ntfyTopic: z.string().min(1, "Topic is required"),
    ntfyServerUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    ntfyToken: z.string().optional(),
    ntfyUsername: z.string().optional(),
    ntfyPassword: z.string().optional(),
});
