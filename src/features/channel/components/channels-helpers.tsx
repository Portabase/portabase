import {UseFormReturn} from "react-hook-form";
import {
    NotifierSmtpForm
} from "@/features/channel/components/notifications/smtp/smtp.form";
import {
    NotifierSlackForm
} from "@/features/channel/components/notifications/slack/slack.form";
import {
    NotifierDiscordForm
} from "@/features/channel/components/notifications/discord/discord.form";
import {
    NotifierTelegramForm
} from "@/features/channel/components/notifications/telegram/telegram.form";
import {
    NotifierGotifyForm
} from "@/features/channel/components/notifications/gotify/gotify.form";
import {
    NotifierNtfyForm
} from "@/features/channel/components/notifications/ntfy/ntfy.form";
import {
    NotifierWebhookForm
} from "@/features/channel/components/notifications/webhook/webhook.form";
import {
    NotifierNextcloudForm
} from "@/features/channel/components/notifications/nextcloud/nextcloud.form";
import {
    NotifierPushoverForm
} from "@/features/channel/components/notifications/pushover/pushover.form";
import {
    notificationProviders,
} from "@/features/channel/components/channels-notification-helper";
import {
    NotifierTeamsForm
} from "@/features/channel/components/notifications/teams/teams.form";
import {storageProviders} from "@/features/channel/components/channels-storage-helper";
import {ForwardRefExoticComponent, JSX, RefAttributes, SVGProps} from "react";
import {LucideProps} from "lucide-react";
import {
    StorageS3Form
} from "@/features/channel/components/storages/s3/s3.form";
import {
    StorageGoogleDriveForm
} from "@/features/channel/components/storages/google-drive/google-drive.form";
import {
    StorageBlobForm
} from "@/features/channel/components/storages/az-blob/az-blob.form";
import {
    StorageGoogleCloudStorageForm
} from "@/features/channel/components/storages/google-cloud-storage/google-cloud-storage.form";


export type ChannelKind = "notification" | "storage";

export function getChannelTextBasedOnKind(kind: ChannelKind) {
    switch (kind) {
        case "notification":
            return "Notification";
        case "storage":
            return "Storage";
        default:
            return "Notification";
    }
}


export type ProviderIconTypes = {
    value: string
    label: string
    icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
    preview?: boolean
} | {
    value: string
    label: string
    icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
    preview?: boolean
}

export const providerIcons: ProviderIconTypes[] = [
    ...notificationProviders,
    ...storageProviders,
];


export const getChannelIcon = (type: string) => {
    const Icon = providerIcons.find((t) => t.value === type)?.icon
    return Icon ? <Icon className="h-4 w-4"/> : null
}


export const renderChannelForm = (provider: string | undefined, form: UseFormReturn<any>) => {
    switch (provider) {
        case "smtp":
            return <NotifierSmtpForm form={form}/>;
        case "slack":
            return <NotifierSlackForm form={form}/>;
        case "discord":
            return <NotifierDiscordForm form={form}/>;
        case "telegram":
            return <NotifierTelegramForm form={form}/>;
        case "gotify":
            return <NotifierGotifyForm form={form}/>;
        case "ntfy":
            return <NotifierNtfyForm form={form}/>;
        case "webhook":
            return <NotifierWebhookForm form={form}/>;
        case "nextcloud":
            return <NotifierNextcloudForm form={form}/>;
        case "teams":
            return <NotifierTeamsForm form={form}/>;
        case "pushover":
            return <NotifierPushoverForm form={form}/>;
        case "s3":
            return <StorageS3Form form={form}/>
        case "google-drive":
            return <StorageGoogleDriveForm form={form}/>
        case "google-cloud-storage":
            return <StorageGoogleCloudStorageForm form={form}/>
        case "blob":
            return <StorageBlobForm form={form}/>
        case "local":
            return <></>
        default:
            return null;
    }
};