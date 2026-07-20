import { z } from "zod";

export const AppriseChannelConfigSchema = z.object({
    appriseServerUrl: z.url("Must be a valid URL"),
    appriseConfigKey: z.string().min(1, "Config key is required"),
    appriseHeaders: z
        .array(
            z.object({
                key: z.string().min(1, "Header name is required"),
                value: z.string(),
            }),
        )
        .optional()
        .default([]),
});

export type AppriseChannelConfig = z.infer<typeof AppriseChannelConfigSchema>;
