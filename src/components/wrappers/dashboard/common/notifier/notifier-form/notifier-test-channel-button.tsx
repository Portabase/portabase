"use client"
import {Button} from "@/components/ui/button";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {useMutation} from "@tanstack/react-query";
import {dispatchNotification} from "@/features/notifications/dispatch";
import {EventPayload} from "@/features/notifications/types";
import {Send} from "lucide-react";
import {toast} from "sonner";
import {useIsMobile} from "@/hooks/use-mobile";
import {cn} from "@/lib/utils";

type NotifierTestChannelButtonProps = {
    notificationChannel: NotificationChannel;
    organizationId?: string;
}

export const NotifierTestChannelButton = ({notificationChannel, organizationId}: NotifierTestChannelButtonProps) => {

    const isMobile = useIsMobile()
    const mutation = useMutation({
        mutationFn: async () => {

            const payload: EventPayload = {
                title: 'Test Channel',
                message: `We are testing channel ${notificationChannel.name}`,
                level: 'info',
                // data: {host: 'db-prod-01', error: 'connection timeout'},
            };

            const result = await dispatchNotification(payload, undefined, notificationChannel.id, organizationId);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error("An error occurred while testing the notification channel");
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
                    <div className={cn(" h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white", !isMobile && "mr-2")}/>
                    {!isMobile && `Sending...`}
                </>
            ) : (
                <div className="flex flex-row justify-center items-center">
                    <Send className={cn("h-4 w-4", !isMobile && "mr-2")}/>{!isMobile && ` Test Channel`}
                </div>
            )}
        </Button>
    )
}