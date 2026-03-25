"use client"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Info} from "lucide-react";
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

export type SettingsNotificationSectionProps = {
    settings: Setting;
    notificationChannels: NotificationChannelWith[];
};

export const SettingsNotificationSection = ({settings, notificationChannels}: SettingsNotificationSectionProps) => {
    const router = useRouter();

    const form = useZodForm({
        schema: DefaultNotificationSchema,
        defaultValues: {
            // notificationChannels: settings.defaultNotificationChannelId ?? undefined,
        }
    });


    const mutation = useMutation({
        mutationFn: async (values: DefaultNotificationType) => {
        //     const result = await updateStorageSettingsAction({name: "system", data: values})
        //     const inner = result?.data;
        //
        //     if (inner?.success) {
        //         toast.success(inner.actionSuccess?.message);
        //         router.refresh();
        //     } else {
        //         toast.error(inner?.actionError?.message);
        //     }
        }
    });


    return (
        <div className="flex flex-col h-full">
            <Alert className="mt-3">
                <Info className="h-4 w-4"/>
                <AlertTitle>Informations</AlertTitle>
                <AlertDescription>
                    The default notification channel will be used to send agent health alert notifications, and will be applied by default if no notification policy is defined at the database or organization level.</AlertDescription>
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
                            name="storageChannelId"
                            render={({field}) => (
                                <FormItem className="flex-grow min-w-[200px] sm:flex-grow-0 sm:w-64">
                                    <FormLabel>Default Notification Provider</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full h-full mb-0">
                                            <SelectValue placeholder="Select a default channel"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {notificationChannels.map((channel) => (
                                                <SelectItem key={channel.id} value={channel.id}>
                                                    <div className="flex items-center gap-2">
                                                        {getChannelIcon(channel.provider)}
                                                        <span className="font-medium">{channel.name}</span>
                                                        <span
                                                            className="text-[9px] uppercase bg-secondary px-1.5 py-0.5 rounded">
                                                            {channel.provider}
                                                          </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                    <ButtonWithLoading className="flex-shrink-0 w-full sm:w-auto" type="submit">
                        Confirm
                    </ButtonWithLoading>
                </Form>
            </div>
        </div>
    );
};
