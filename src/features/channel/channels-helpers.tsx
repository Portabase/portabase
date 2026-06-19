import {UseFormReturn} from "react-hook-form";
import {
    NotifierSmtpForm
} from "@/features/channel/notifications/smtp.form";
import {
    NotifierSlackForm
} from "@/features/channel/notifications/slack.form";
import {
    NotifierDiscordForm
} from "@/features/channel/notifications/discord.form";
import {
    NotifierTelegramForm
} from "@/features/channel/notifications/telegram.form";
import {
    NotifierGotifyForm
} from "@/features/channel/notifications/gotify.form";
import {
    NotifierNtfyForm
} from "@/features/channel/notifications/ntfy.form";
import {
    NotifierWebhookForm
} from "@/features/channel/notifications/webhook.form";
import {
    NotifierNextcloudForm
} from "@/features/channel/notifications/nextcloud.form";
import {
    NotifierPushoverForm
} from "@/features/channel/notifications/pushover.form";
import {
    notificationProviders,
} from "@/features/channel/channels-notification-helper";
import {
    NotifierTeamsForm
} from "@/features/channel/notifications/teams.form";
import {storageProviders} from "@/features/channel/channels-storage-helper";
import {ForwardRefExoticComponent, JSX, RefAttributes, SVGProps} from "react";
import {LucideProps} from "lucide-react";
import {
    StorageS3Form
} from "@/features/channel/storages/s3.form";
import {
    StorageGoogleDriveForm
} from "@/features/channel/storages/google-drive/google-drive.form";

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
        case "local":
            return <></>
        default:
            return null;
    }
};