"use client";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {Switch} from "@/components/ui/switch";
import {toast} from "sonner";
import {useState} from "react";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {ChannelKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {
    updateNotificationChannelAction
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/notifications/action";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";
import {
    updateStorageChannelAction
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/storages/action";

export type EditChannelButtonProps = {
    channel: NotificationChannelWith | StorageChannelWith;
    organization?: OrganizationWithMembers;
    organizations?: OrganizationWithMembers[];
    adminView?: boolean;
    kind: ChannelKind;
};

export const EditChannelButton = ({
                                      organizations,
                                      adminView = false,
                                      channel,
                                      organization,
                                      kind
                                  }: EditChannelButtonProps) => {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);


    const mutation = useMutation({
        mutationFn: async (value: boolean) => {


            const payload = {
                data: {
                    name: channel.name,
                    provider: channel.provider,
                    config: channel.config as Record<string, any>,
                    enabled: value
                },
                id: channel.id
            };

            let result: any;
            if (kind == "notification") {
                // @ts-ignore
                result = await updateNotificationChannelAction(payload)
            } else if (kind == "storage") {
                // @ts-ignore
                result = await updateStorageChannelAction(payload)
            } else {
                toast.error("An error occurred while updating storage channel")
                return;
            }
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
        <>
            <Switch checked={channel.enabled} onCheckedChange={async () => {
                await mutation.mutateAsync(!channel.enabled)
            }}
            />
            <ChannelAddEditModal
                kind={kind}
                organizations={organizations}
                adminView={adminView}
                organization={organization}
                channel={channel}
                open={isAddModalOpen}
                onOpenChangeAction={setIsAddModalOpen}
            />
        </>
    );
};
