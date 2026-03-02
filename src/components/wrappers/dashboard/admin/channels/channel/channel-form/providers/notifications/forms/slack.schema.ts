import {z} from "zod";

export const SlackChannelConfigSchema = z.object({
    slackWebhook: z.string().url("Must be a valid URL"),
});
