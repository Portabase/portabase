import { z } from "zod";

export const APPRISE_FORMATS = ["text", "markdown", "html"] as const;

export const AppriseChannelConfigSchema = z
    .object({
        appriseServerUrl: z.string().url("Must be a valid URL"),
        appriseConfigKey: z.string().optional().default(""),
        appriseUrls: z.string().optional().default(""),
        appriseTag: z.string().optional().default(""),
        appriseFormat: z.enum(APPRISE_FORMATS).default("text"),
        appriseHeaders: z
            .array(
                z.object({
                    key: z.string().min(1, "Header name is required"),
                    value: z.string(),
                }),
            )
            .optional()
            .default([]),
    })
    .superRefine((val, ctx) => {
        const hasKey = !!val.appriseConfigKey?.trim();
        const hasUrls = !!val.appriseUrls?.trim();
        if (!hasKey && !hasUrls) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Provide either a config key or at least one Apprise URL",
                path: ["appriseUrls"],
            });
        }
    });

export type AppriseChannelConfig = z.infer<typeof AppriseChannelConfigSchema>;
