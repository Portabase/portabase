import {z} from "zod";

export const TeamsChannelConfigSchema = z.object({
    teamsWebhook: z.string().url("Must be a valid URL"),
});
