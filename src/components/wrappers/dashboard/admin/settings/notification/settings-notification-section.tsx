"use client"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Info, Send} from "lucide-react";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useRouter} from "next/navigation";
import {Setting} from "@/db/schema/01_setting";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    useZodForm
} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useMutation} from "@tanstack/react-query";
import {getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {
    DefaultNotificationSchema, DefaultNotificationType
} from "@/components/wrappers/dashboard/admin/settings/notification/settings-notification.schema";
import {
    updateNotificationSettingsAction
} from "@/components/wrappers/dashboard/admin/settings/notification/settings-notification.action";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";

export type SettingsNotificationSectionProps = {
    settings: Setting;
    notificationChannels: NotificationChannelWith[];
};

export const SettingsNotificationSection = ({settings, notificationChannels}: SettingsNotificationSectionProps) => {
    const router = useRouter();

    const form = useZodForm({
        schema: DefaultNotificationSchema,
        defaultValues: {
            notificationChannelId: settings.defaultNotificationChannelId ?? "",
        }
    });

    const mutation = useMutation({
        mutationFn: async (values: DefaultNotificationType) => {
            const result = await updateNotificationSettingsAction({name: "system", data: values})
            const inner = result?.data;
            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }
        }
    });

    return (
        <div className="flex flex-col h-full">
            <Alert className="mt-3 flex items-start gap-2">
                <Info className="h-4 w-4 mt-1"/>
                <div>
                    <AlertTitle>Informations</AlertTitle>
                    <AlertDescription className="flex flex-wrap items-center gap-1">
                        The default notification channel will be used to send
                        <Badge>error_health_agent</Badge>
                        <Badge>error_health_database</Badge>
                        <Badge>error_backup</Badge>
                        <Badge>error_restore</Badge>
                        events. For more options like notify when success, please set policy at database level
                    </AlertDescription>
                </div>
            </Alert>
            <div className="flex flex-col h-full py-4 gap-3">
                <Form
                    className="space-y-4"
                    form={form}
                    onSubmit={async (values) => {
                        await mutation.mutateAsync(values);
                    }}
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <FormField
                            control={form.control}
                            name="notificationChannelId"
                            render={({ field }) => (
                                <FormItem className="flex-grow ">
                                    <FormLabel>Default Notification Provider</FormLabel>
                                    {notificationChannels.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No channel available</div>
                                    ) : (
                                        <Select
                                            value={field.value ?? ""}
                                            onValueChange={(value) => field.onChange(value)}
                                        >
                                            <SelectTrigger className="w-full h-full mb-0">
                                                <SelectValue placeholder="Select a default channel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {notificationChannels.map((channel) => (
                                                    <SelectItem key={channel.id} value={channel.id}>
                                                        <div className="flex items-center gap-2">
                                                            {getChannelIcon(channel.provider)}
                                                            <span className="font-medium">{channel.name}</span>
                                                            <span className="text-[9px] uppercase bg-secondary px-1.5 py-0.5 rounded">
                                                                {channel.provider}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </FormItem>
                            )}
                        />
                    </div>


                    <div className="flex justify-between gap-4">

                        {notificationChannels.length > 0 && (
                            <ButtonWithLoading
                                type="submit"
                            >
                                Confirm
                            </ButtonWithLoading>
                        )}

                        <div className="flex justify-end">
                            {notificationChannels.length > 0 && form.getValues("notificationChannelId") ? (
                                <ButtonWithLoading
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        form.setValue("notificationChannelId", "");
                                        await mutation.mutateAsync({
                                            notificationChannelId: null,
                                        });
                                    }}
                                    className="flex-shrink-0 w-full sm:w-auto"
                                >
                                    Reset
                                </ButtonWithLoading>
                            ) : null}
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
};