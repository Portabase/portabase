import {z} from "zod";
import {SlackChannelConfigSchema} from "./providers/notifications/forms/slack.schema";
import {SmtpChannelConfigSchema} from "./providers/notifications/forms/smtp.schema";
import {DiscordChannelConfigSchema} from "./providers/notifications/forms/discord.schema";
import {TelegramChannelConfigSchema} from "./providers/notifications/forms/telegram.schema";
import {GotifyChannelConfigSchema} from "./providers/notifications/forms/gotify.schema";
import {NtfyChannelConfigSchema} from "./providers/notifications/forms/ntfy.schema";
import {WebhookChannelConfigSchema} from "./providers/notifications/forms/webhook.schema";
import {S3ChannelConfigSchema} from "./providers/storages/forms/s3.schema";
import {GoogleDriveChannelConfigSchema} from "./providers/storages/forms/google-drive.schema";
import {LocalChannelConfigSchema} from "./providers/storages/forms/local.schema";


const BaseChannelFormSchema = z.object({
    name: z
        .string()
        .min(5, "Name must be at least 5 characters long")
        .max(40, "Name must be at most 40 characters long"),
    enabled: z.boolean().default(true),
});

export const NotificationChannelFormSchema = z.discriminatedUnion("provider", [
    BaseChannelFormSchema.extend({
        provider: z.literal("slack"),
        config: SlackChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("smtp"),
        config: SmtpChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("discord"),
        config: DiscordChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("telegram"),
        config: TelegramChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("gotify"),
        config: GotifyChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("ntfy"),
        config: NtfyChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("webhook"),
        config: WebhookChannelConfigSchema,
    }),
]);

export const StorageChannelFormSchema = z.discriminatedUnion("provider", [
    BaseChannelFormSchema.extend({
        provider: z.literal("s3"),
        config: S3ChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("google-drive"),
        config: GoogleDriveChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("local"),
        config: LocalChannelConfigSchema
    })
]);


export type NotificationChannelFormType = z.infer<typeof NotificationChannelFormSchema>;
export type StorageChannelFormType = z.infer<typeof StorageChannelFormSchema>;
