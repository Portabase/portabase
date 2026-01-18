"use client";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {Trash2} from "lucide-react";
import {
    removeNotificationChannelAction,
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/action";
import {toast} from "sonner";
import {ChannelKind, getChannelTextBasedOnKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {
    removeStorageChannelAction
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/storages/action";

export type DeleteChannelButtonProps = {
    channelId: string;
    kind: ChannelKind;
    organizationId?: string;
};

export const DeleteChannelButton = ({channelId, organizationId, kind}: DeleteChannelButtonProps) => {
    const router = useRouter();
    const channelText = getChannelTextBasedOnKind(kind)


    const mutation = useMutation({
        mutationFn: async () => {

            const result = kind === "notification" ? await removeNotificationChannelAction({
                organizationId,
                notificationChannelId: channelId
            }) : await removeStorageChannelAction({organizationId, id: channelId})
            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }
        },
    });

    return (
        <ButtonWithConfirm
            title={`Delete ${channelText.toLowerCase()} channel`}
            description={`Are you sure you want to remove this ${channelText.toLowerCase()} channel ? This action cannot be undone and will delete all alert policies related to this channel !`}
            button={{
                main: {
                    size: "icon",
                    variant: "ghost",
                    icon: <Trash2 color="red"/>,
                },
                confirm: {
                    className: "w-full",
                    text: "Delete",
                    icon: <Trash2/>,
                    variant: "destructive",
                    onClick: () => {
                        mutation.mutate();
                    },
                },
                cancel: {
                    className: "w-full",
                    text: "Cancel",
                    icon: <Trash2/>,
                    variant: "outline",
                },
            }}
            isPending={mutation.isPending}
        />
    );
};
