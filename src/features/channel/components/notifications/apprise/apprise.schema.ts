import { z } from "zod";

export const AppriseChannelConfigSchema = z.object({
    appriseServerUrl: z.string().url("Must be a valid URL"),
    appriseConfigKey: z.string().min(1, "Config key is required"),
});

export type AppriseChannelConfig = z.infer<typeof AppriseChannelConfigSchema>;
