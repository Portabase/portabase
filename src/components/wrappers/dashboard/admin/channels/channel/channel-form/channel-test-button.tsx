"use client"

import {useMutation} from "@tanstack/react-query";
import {Send, ShieldCheck} from "lucide-react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {dispatchNotification} from "@/features/notifications/dispatch";
import {EventPayload} from "@/features/notifications/types";
import {useIsMobile} from "@/hooks/use-mobile";
import {cn} from "@/lib/utils";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {ChannelKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";


type NotifierTestChannelButtonProps = {
    channel: NotificationChannel | StorageChannel;
    organizationId?: string;
    kind: ChannelKind;
}

export const ChannelTestButton = ({channel, organizationId, kind}: NotifierTestChannelButtonProps) => {

    const isMobile = useIsMobile()

    const mutation = useMutation({
        mutationFn: async () => {
            if (kind === "notification") {
                const payload: EventPayload = {
                    title: 'Test Channel',
                    message: `We are testing channel ${channel.name}`,
                    level: 'info',
                };
                const result = await dispatchNotification(payload, undefined, channel.id, organizationId);

                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error("An error occurred while testing the notification channel, check your configuration");
                }
            } else if (kind === "storage") {
                const input: StorageInput = {
                    action: "ping",
                };
                const result = await dispatchStorage(input, undefined, undefined, channel);

                if (result.success) {
                    toast.success("Successfully connected to storage channel");
                } else {
                    console.error(result);
                    const responseText = result.response ? `(${result.response})` : "";
                    toast.error(`An error occurred while testing the storage channel, check your configuration ${responseText}`);
                }
            } else {
                toast.error("Not yet supported");
            }

        },
    });

    return (
        <Button
            type="button"
            variant="default"
            onClick={() => mutation.mutateAsync()}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all"
        >
            {mutation.isPending ? (
                <>
                    <div
                        className={cn(" h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white", !isMobile && "mr-2")}/>
                    {!isMobile && `Sending...`}
                </>
            ) : (
                <div className="flex flex-row justify-center items-center">
                    {kind === "notification" ?
                        <>
                            <Send className={cn("h-4 w-4", !isMobile && "mr-2")}/>{!isMobile && ` Test Channel`}
                        </>
                        :
                        <>
                            <ShieldCheck className={cn("h-4 w-4", !isMobile && "mr-2")}/>{!isMobile && ` Test Storage`}
                        </>
                    }
                </div>
            )}
        </Button>
    )
}