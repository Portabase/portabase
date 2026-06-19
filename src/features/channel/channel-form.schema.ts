import {z} from "zod";
import {SlackChannelConfigSchema} from "@/features/channel/notifications/slack.schema";
import {SmtpChannelConfigSchema} from "@/features/channel/notifications/smtp.schema";
import {DiscordChannelConfigSchema} from "@/features/channel/notifications/discord.schema";
import {TelegramChannelConfigSchema} from "@/features/channel/notifications/telegram.schema";
import {GotifyChannelConfigSchema} from "@/features/channel/notifications/gotify.schema";
import {NtfyChannelConfigSchema} from "@/features/channel/notifications/ntfy.schema";
import {WebhookChannelConfigSchema} from "@/features/channel/notifications/webhook.schema";
import {NextcloudChannelConfigSchema} from "@/features/channel/notifications/nextcloud.schema";
import {PushoverChannelConfigSchema} from "@/features/channel/notifications/pushover.schema";
import {S3ChannelConfigSchema} from "@/features/channel/storages/s3.schema";
import {GoogleDriveChannelConfigSchema} from "@/features/channel/storages/google-drive/google-drive.schema";
import {LocalChannelConfigSchema} from "@/features/channel/storages/local.schema";
import {TeamsChannelConfigSchema} from "@/features/channel/notifications/teams.schema";


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
    BaseChannelFormSchema.extend({
        provider: z.literal("nextcloud"),
        config: NextcloudChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("teams"),
        config: TeamsChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("pushover"),
        config: PushoverChannelConfigSchema,
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
