"use client"

import {useMutation} from "@tanstack/react-query";
import {Send, ShieldCheck} from "lucide-react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {testChannelAction} from "@/features/channel/components/channel-test.action";
import {ChannelKind} from "@/features/channel/components/channels-helpers";
import {useIsMobile} from "@/hooks/use-mobile";
import {cn} from "@/lib/utils";


type NotifierTestChannelButtonProps = {
    channel: NotificationChannel | StorageChannel;
    organizationId?: string;
    kind: ChannelKind;
    isFormValid: boolean;
}

export const ChannelTestButton = ({channel, organizationId, kind, isFormValid}: NotifierTestChannelButtonProps) => {

    const isMobile = useIsMobile()

    const slugFromDatabaseName =
        kind === "notification" &&
        channel.provider === "healthchecks" &&
        Boolean((channel.config as { useDatabaseNameAsSlug?: boolean } | null)?.useDatabaseNameAsSlug);

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await testChannelAction({kind, organizationId, channel});
            const result = response?.data ?? {success: false, message: undefined, response: response?.serverError};

            if (kind === "notification") {
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error("An error occurred while testing the notification channel, check your configuration");
                }
            } else {
                if (result.success) {
                    toast.success("Successfully connected to storage channel");
                } else {
                    const responseText = result.response ? `(${result.response})` : "";
                    toast.error(`An error occurred while testing the storage channel, check your configuration ${responseText}`);
                }
            }

        },
    });

    let disabledReason: string | undefined;
    if (slugFromDatabaseName) {
        disabledReason = "This channel builds its ping URL from the database name of each event, so there is nothing to ping outside a real backup.";
    } else if (!isFormValid && !mutation.isPending) {
        disabledReason = "Complete required fields before testing this channel.";
    }
    const isDisabled = mutation.isPending || disabledReason !== undefined;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div>
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => mutation.mutateAsync()}
                        disabled={isDisabled}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
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
                </div>
            </TooltipTrigger>

            {disabledReason && (
                <TooltipContent>
                    {disabledReason}
                </TooltipContent>
            )}
        </Tooltip>
    )
}
