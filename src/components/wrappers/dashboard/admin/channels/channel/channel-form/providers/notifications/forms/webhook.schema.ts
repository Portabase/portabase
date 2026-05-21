import { z } from "zod";

export const WebhookChannelConfigSchema = z.object({
    webhookUrl: z.string().url("Must be a valid URL"),
    webhookHeaders: z
        .array(
            z.object({
                key: z.string().min(1, "Header name is required"),
                value: z.string(),
            }),
        )
        .optional()
        .default([]),
});

export type WebhookChannelConfig = z.infer<typeof WebhookChannelConfigSchema>;
