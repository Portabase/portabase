import { z } from "zod";

export const HealthchecksChannelConfigSchema = z
    .object({
        baseUrl: z.url("Must be a valid URL").default("https://hc-ping.com"),
        pingKey: z.string().min(1, "Ping key or check UUID is required"),
        slug: z.string().optional(),
        useDatabaseNameAsSlug: z.boolean().optional().default(false),
        autoCreate: z.boolean().optional().default(false),
    })
    .refine((config) => !(config.slug?.trim() && config.useDatabaseNameAsSlug), {
        message: "Use either a fixed slug or the database name, not both",
        path: ["slug"],
    });

export type HealthchecksChannelConfig = z.infer<typeof HealthchecksChannelConfigSchema>;
