import { z } from "zod";

export const NextcloudChannelConfigSchema = z.object({
    nextcloudUrl: z.string().url("Must be a valid URL"),
    nextcloudBotToken: z.string().min(1, "Bot token is required"),
    nextcloudBotSecret: z.string().min(1, "Bot secret is required"),
});
