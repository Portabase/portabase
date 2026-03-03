import {z} from "zod";

export const WebhookChannelConfigSchema = z.object({
    webhookUrl: z.string().url("Must be a valid URL"),
    webhookSecretHeader: z.string().optional(),
    webhookSecret: z.string().optional(),
});
