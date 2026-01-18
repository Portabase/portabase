import {UseFormReturn} from "react-hook-form";
import {
    NotifierSmtpForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/smtp.form";
import {
    NotifierSlackForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/slack.form";
import {
    NotifierDiscordForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/discord.form";
import {
    NotifierTelegramForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/telegram.form";
import {
    NotifierGotifyForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/gotify.form";
import {
    NotifierNtfyForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/ntfy.form";
import {
    NotifierWebhookForm
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/forms/webhook.form";
import {
    notificationProviders,
} from "@/components/wrappers/dashboard/admin/channels/helpers/notification";
import {storageProviders} from "@/components/wrappers/dashboard/admin/channels/helpers/storage";
import {ForwardRefExoticComponent, JSX, RefAttributes, SVGProps} from "react";
import {LucideProps} from "lucide-react";
import {
    StorageS3Form
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/storages/forms/s3.form";

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
        case "s3":
            return <StorageS3Form form={form}/>
        case "local":
            return <></>
        default:
            return null;
    }
};