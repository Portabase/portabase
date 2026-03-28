"use client"
import {ReactNode, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {DatabaseWith} from "@/db/schema/07_database";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {ChannelKind, getChannelTextBasedOnKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {ChannelPoliciesForm} from "@/components/wrappers/dashboard/database/channels-policy/policy-form";


type ChannelPoliciesModalProps = {
    database: DatabaseWith;
    channels: NotificationChannel[] | StorageChannel[];
    organizationId: string;
    kind: ChannelKind;
    icon: ReactNode;

}

export const ChannelPoliciesModal = ({icon, kind, database, channels, organizationId}: ChannelPoliciesModalProps) => {
    const [open, setOpen] = useState(false);
    const channelText = getChannelTextBasedOnKind(kind)


    const channelsFiltered = channels
        .filter((channel) => channel.enabled)

    const channelsIds = channelsFiltered
        .map(channel => channel.id);
    const activeAlertPolicies = database.alertPolicies?.filter((policy) => channelsIds.includes(policy.notificationChannelId));
    const activeStoragePolicies = database.storagePolicies?.filter((policy) => channelsIds.includes(policy.storageChannelId));


    const activePolicies = kind === "notification" ? activeAlertPolicies : activeStoragePolicies;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)} className="relative">
                    {icon}
                    {activePolicies && activePolicies.length > 0 && (
                        <Badge
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
                        >
                            {activePolicies.length}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{channelText} policies</DialogTitle>
                    <DialogDescription>
                        Add and manage your database {channelText.toLowerCase()} policies
                    </DialogDescription>
                    <Separator className="mt-3 mb-3"/>
                    <ChannelPoliciesForm
                        organizationId={organizationId}
                        channels={channels}
                        database={database}
                        onSuccess={() => setOpen(false)}
                        kind={kind}
                    />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}