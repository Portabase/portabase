import {z} from "zod";
import {SlackChannelConfigSchema} from "@/features/channel/components/notifications/slack.schema";
import {SmtpChannelConfigSchema} from "@/features/channel/components/notifications/smtp.schema";
import {DiscordChannelConfigSchema} from "@/features/channel/components/notifications/discord.schema";
import {TelegramChannelConfigSchema} from "@/features/channel/components/notifications/telegram.schema";
import {GotifyChannelConfigSchema} from "@/features/channel/components/notifications/gotify.schema";
import {NtfyChannelConfigSchema} from "@/features/channel/components/notifications/ntfy.schema";
import {WebhookChannelConfigSchema} from "@/features/channel/components/notifications/webhook.schema";
import {NextcloudChannelConfigSchema} from "@/features/channel/components/notifications/nextcloud.schema";
import {PushoverChannelConfigSchema} from "@/features/channel/components/notifications/pushover.schema";
import {S3ChannelConfigSchema} from "@/features/channel/components/storages/s3.schema";
import {GoogleDriveChannelConfigSchema} from "@/features/channel/components/storages/google-drive/google-drive.schema";
import {LocalChannelConfigSchema} from "@/features/channel/components/storages/local.schema";
import {TeamsChannelConfigSchema} from "@/features/channel/components/notifications/teams.schema";
import {BlobChannelConfigSchema} from "@/features/channel/components/storages/az-blob.schema";


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
        provider: z.literal("blob"),
        config: BlobChannelConfigSchema,
    }),
    BaseChannelFormSchema.extend({
        provider: z.literal("local"),
        config: LocalChannelConfigSchema
    })
]);


export type NotificationChannelFormType = z.infer<typeof NotificationChannelFormSchema>;
export type StorageChannelFormType = z.infer<typeof StorageChannelFormSchema>;
