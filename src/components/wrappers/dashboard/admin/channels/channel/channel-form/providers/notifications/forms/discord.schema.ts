import {z} from "zod";

export const DiscordChannelConfigSchema = z.object({
    discordWebhook: z.string().url("Must be a valid URL"),
});
