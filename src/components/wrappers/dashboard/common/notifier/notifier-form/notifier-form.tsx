"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Input} from "@/components/ui/input";
import {
    NotificationChannelFormSchema, NotificationChannelFormType
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/notifier-form.schema";
import {
    addNotificationChannelAction, updateNotificationChannelAction
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/notifier-form.action";
import {toast} from "sonner";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {
    NotifierSmtpForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-smtp.form";
import {
    NotifierSlackForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-slack.form";
import {
    NotifierDiscordForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-discord.form";
import {
    NotifierTelegramForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-telegram.form";
import {
    NotifierGotifyForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-gotify.form";
import {
    NotifierNtfyForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-ntfy.form";
import {
    NotifierWebhookForm
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/providers/notifier-webhook.form";
import {Button} from "@/components/ui/button";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {
    NotifierTestChannelButton
} from "@/components/wrappers/dashboard/common/notifier/notifier-form/notifier-test-channel-button";
import {useEffect} from "react";
import {notificationProviders} from "@/components/wrappers/dashboard/admin/notifications/helpers";
import {cn} from "@/lib/utils";
import {Card} from "@/components/ui/card";
import {ArrowLeft} from "lucide-react";

type NotifierFormProps = {
    onSuccessAction?: () => void;
    organization?: OrganizationWithMembers;
    defaultValues?: NotificationChannelWith
    adminView?: boolean
};

export const NotifierForm = ({onSuccessAction, organization, defaultValues}: NotifierFormProps) => {

    const router = useRouter();
    const isCreate = !Boolean(defaultValues);


    const form = useZodForm({
        schema: NotificationChannelFormSchema,
        // @ts-ignore
        defaultValues: {...defaultValues},
    });

    useEffect(() => {
        form.reset(defaultValues ? {...defaultValues} : {});
    }, [defaultValues]);

    const mutationAddNotificationChannel = useMutation({
        mutationFn: async (values: NotificationChannelFormType) => {

            const payload = {
                data: values,
                ...(organization && {organizationId: organization.id}),
                ...((defaultValues && {notificationChannelId: defaultValues.id}))
            };

            // @ts-ignore
            const result = isCreate ? await addNotificationChannelAction(payload) : await updateNotificationChannelAction(payload);
            const inner = result?.data;

            if (inner?.success) {
                toast.success(inner.actionSuccess?.message);
                isCreate && onSuccessAction?.();
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
                isCreate && onSuccessAction?.();
            }
        }
    });

    const provider = form.watch("provider");
    const selectedProviderDetails = notificationProviders.find(t => t.value === provider);

    if (isCreate && !provider) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
                {notificationProviders.map((type) => {
                    const Icon = type.icon;
                    return (
                        <Card
                            key={type.value}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-3 p-4 transition-all",
                                type.preview
                                    ? "cursor-not-allowed bg-gray-200 border-gray-300 opacity-70"
                                    : "cursor-pointer hover:bg-accent/50 hover:border-primary/50"
                            )}
                            onClick={() => {
                                if (type.preview) return;
                                form.setValue("provider", type.value as any);
                                form.setValue("config", {});
                            }}
                        >
                            {type.preview && (
                                <div
                                    className="absolute bottom-0 right-0 overflow-hidden w-20 h-20 pointer-events-none">
                                    <div
                                        className="absolute bottom-0 right-0 w-38 h-6 flex items-center justify-center
                                            transform -rotate-45 translate-x-14 -translate-y-4"
                                        style={{backgroundColor: "#FE6702"}}
                                    >
                                        <span className="text-white text-[8px] pr-3 font-medium text-center w-full">coming soon</span>
                                    </div>
                                </div>
                            )}
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                type.preview ? "bg-gray-400" : "bg-secondary"
                            )}>
                                <Icon className={cn("h-6 w-6 text-foreground", type.preview && "text-gray-700")}/>
                            </div>
                            <span className={cn(
                                "font-medium text-sm align-middle text-center",
                                type.preview ? "text-gray-500" : "text-foreground"
                            )}>
                            {type.label}
                          </span>
                        </Card>

                    );
                })}
            </div>
        );
    }

    return (
        <Form
            form={form}
            className="flex flex-col gap-4"
            onSubmit={async (values) => {
                await mutationAddNotificationChannel.mutateAsync(values);
            }}
        >
            <div className="flex items-center gap-3 mb-2 p-3 bg-secondary/30 rounded-lg border border-border">
                {selectedProviderDetails && (
                    <div
                        className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border shadow-sm">
                        <selectedProviderDetails.icon className="h-5 w-5"/>
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-sm font-medium">Configuring {selectedProviderDetails?.label}</p>
                    <p className="text-xs text-muted-foreground">{isCreate ? "New Channel" : "Edit Channel"}</p>
                </div>
                {isCreate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            form.setValue("provider", undefined as any);
                            form.setValue("config", undefined);
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Change
                    </Button>
                )}
            </div>

            <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Channel Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={`My ${selectedProviderDetails?.label} Channel`}
                                   value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="provider"
                render={({field}) => (
                    <input type="hidden" {...field} value={field.value || ""}/>
                )}
            />

            {provider === "smtp" && (
                <NotifierSmtpForm form={form}/>
            )}

            {provider === "slack" && (
                <NotifierSlackForm form={form}/>
            )}

            {provider === "discord" && (
                <NotifierDiscordForm form={form}/>
            )}

            {provider === "telegram" && (
                <NotifierTelegramForm form={form}/>
            )}

            {provider === "gotify" && (
                <NotifierGotifyForm form={form}/>
            )}

            {provider === "ntfy" && (
                <NotifierNtfyForm form={form}/>
            )}

            {provider === "webhook" && (
                <NotifierWebhookForm form={form}/>
            )}


            <div className="flex justify-between mt-4">
                <div>
                    {defaultValues && (
                        <NotifierTestChannelButton organizationId={organization?.id}
                                                   notificationChannel={defaultValues}/>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onSuccessAction?.();
                            form.reset();
                        }}
                    >
                        Cancel
                    </Button>
                    <ButtonWithLoading isPending={mutationAddNotificationChannel.isPending}>
                        {isCreate ? "Add" : "Save"} Channel
                    </ButtonWithLoading>
                </div>

            </div>
        </Form>
    );
};