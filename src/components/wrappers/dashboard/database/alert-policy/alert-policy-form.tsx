import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {InfoIcon, Plus, Trash2} from "lucide-react";
import {useFieldArray} from "react-hook-form";
import {
    AlertPoliciesSchema, AlertPoliciesType, AlertPolicyType,
    EVENT_KIND_OPTIONS
} from "@/components/wrappers/dashboard/database/alert-policy/alert-policy.schema";
import {DatabaseWith} from "@/db/schema/07_database";
import {AlertPolicy} from "@/db/schema/10_alert-policy";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {
    createAlertPoliciesAction, deleteAlertPoliciesAction,
    updateAlertPoliciesAction
} from "@/components/wrappers/dashboard/database/alert-policy/alert-policy.action";
import {useRouter} from "next/navigation";
import {Switch} from "@/components/ui/switch";
import {getNotificationChannelIcon} from "@/components/wrappers/dashboard/admin/notifications/helpers";
import {Card} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import Link from "next/link";

type AlertPolicyFormProps = {
    onSuccess?: () => void;
    notificationChannels: NotificationChannel[];
    organizationId: string;
    database: DatabaseWith;
};

export const AlertPolicyForm = ({database, notificationChannels, organizationId, onSuccess}: AlertPolicyFormProps) => {
    const router = useRouter()
    const organizationNotificationChannels = notificationChannels.map(channel => channel.id) ?? [];


    const formattedAlertPoliciesList = (alertPolicies: AlertPolicy[]) => {
        return alertPolicies.filter((alertPolicy) => organizationNotificationChannels.includes(alertPolicy.notificationChannelId)).map((alertPolicy) => ({
            notificationChannelId: alertPolicy.notificationChannelId,
            eventKinds: alertPolicy.eventKinds,
            enabled: alertPolicy.enabled
        }));
    };

    const form = useZodForm({
        schema: AlertPoliciesSchema,
        defaultValues: {
            alertPolicies: database.alertPolicies && database.alertPolicies.length > 0 ? formattedAlertPoliciesList(database.alertPolicies) : [],
        },
    });

    const {fields, append, remove} = useFieldArray({
        control: form.control,
        name: "alertPolicies",
    })


    const addAlertPolicy = () => {
        append({notificationChannelId: "", eventKinds: [], enabled: true});
    }

    const removeAlertPolicy = (index: number) => {
        remove(index)
    }

    const onCancel = () => {
        form.reset()
        onSuccess?.()
    }


    const mutation = useMutation({
        mutationFn: async ({alertPolicies}: AlertPoliciesType) => {
            const defaultFormatedAlertPolicies = formattedAlertPoliciesList(database?.alertPolicies ?? []);

            const alertPoliciesToAdd = alertPolicies?.filter(
                (alertPolicy) => !defaultFormatedAlertPolicies.some((a) => a.notificationChannelId == alertPolicy.notificationChannelId)
            ) ?? [];

            const alertPoliciesToRemove = defaultFormatedAlertPolicies.filter(
                (alertPolicy) => !alertPolicies?.some((v) => v.notificationChannelId === alertPolicy.notificationChannelId)
            ) ?? [];

            const alertPoliciesToUpdate = alertPolicies?.filter((alertPolicy) => {
                const existing = defaultFormatedAlertPolicies.find((a) => a.notificationChannelId === alertPolicy.notificationChannelId);
                return existing &&
                    (existing.eventKinds !== alertPolicy.eventKinds || existing.enabled !== alertPolicy.enabled);
            }) ?? [];


            const results = await Promise.allSettled([
                alertPoliciesToAdd.length > 0
                    ? createAlertPoliciesAction({
                        databaseId: database.id,
                        alertPolicies: alertPoliciesToAdd,
                    })
                    : Promise.resolve(null),

                alertPoliciesToUpdate.length > 0
                    ? updateAlertPoliciesAction({
                        databaseId: database.id,
                        alertPolicies: alertPoliciesToUpdate,
                    })
                    : Promise.resolve(null),

                alertPoliciesToRemove.length > 0
                    ? deleteAlertPoliciesAction({
                        databaseId: database.id,
                        alertPolicies: alertPoliciesToRemove as AlertPolicyType[],
                    })
                    : Promise.resolve(null),
            ]);

            const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
            if (rejected) {
                throw new Error(rejected.reason?.message || "Network or server error");
            }

            const failedActions = results
                .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
                .map(r => r.value)
                .filter((value): value is { data: { success: false; actionError: any } } =>
                    value !== null && typeof value === "object" && value.data.success === false
                );


            if (failedActions.length > 0) {
                const firstError = failedActions[0].data.actionError;
                const message = firstError?.message || "One or more operations failed";
                throw new Error(message);
            }

            return {success: true};
        },
        onSuccess: () => {
            toast.success("Alert policies saved successfully");
            //onSuccess?.();
            router.refresh();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save alert policies");
        },
    });


    return (
        <Form
            form={form}
            className="flex flex-col gap-6"
            onSubmit={async (values) => {
                await mutation.mutateAsync(values);
            }}
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-medium">Configure Alerts</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose which channels receive notifications for specific events.
                        </p>
                    </div>
                    <Button
                        disabled={
                            fields.length >= notificationChannels.length ||
                            notificationChannels.length === 0
                        }
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={addAlertPolicy}>
                        <Plus className="w-4 h-4 mr-1.5"/>
                        Add Policy
                    </Button>
                </div>

                <div className="space-y-3 w-full">
                    {organizationNotificationChannels.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <InfoIcon className="h-8 w-8 text-muted-foreground/50"/>
                            <p className="font-medium text-sm text-foreground">No notification channels</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Please <Link href={`/dashboard/settings`} className="underline underline-offset-4 hover:text-primary transition-colors">configure notification channels</Link> in your organization settings first.
                            </p>
                        </div>
                    ) : fields.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-primary"/>
                            </div>
                            <p className="font-medium text-sm text-foreground">No alert policies</p>
                            <p className="text-xs text-muted-foreground">
                                Click "Add Policy" to start receiving notifications.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 transition-all hover:border-primary/50 relative group">
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                                                    Notification Channel
                                                </Label>
                                                <FormField
                                                    control={form.control}
                                                    name={`alertPolicies.${index}.notificationChannelId`}
                                                    render={({field}) => {
                                                        const selectedIds = form
                                                            .watch("alertPolicies")
                                                            .map((a: AlertPolicyType) => a.notificationChannelId)
                                                            .filter(Boolean);

                                                        const availableNotificationChannels = notificationChannels.filter(
                                                            (channel) =>
                                                                channel.id.toString() === field.value?.toString() ||
                                                                !selectedIds.includes(channel.id.toString())
                                                        );

                                                        const selectedChannel = notificationChannels.find(c => c.id === field.value);

                                                        return (
                                                            <FormItem className="space-y-0">
                                                                <Select onValueChange={field.onChange}
                                                                        value={field.value?.toString() || ""}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-9 w-full bg-background border-input">
                                                                            <SelectValue placeholder="Select channel">
                                                                                 {selectedChannel ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={cn("flex items-center justify-center h-4 w-4 rounded")}>
                                                                                            {getNotificationChannelIcon(selectedChannel.provider)}
                                                                                        </div>
                                                                                        <span className="truncate font-medium text-sm">{selectedChannel.name}</span>
                                                                                        <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground ml-auto font-mono uppercase tracking-tighter">{selectedChannel.provider}</span>
                                                                                    </div>
                                                                                ) : "Select channel"}
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {availableNotificationChannels.map((channel) => (
                                                                            <SelectItem key={channel.id.toString()}
                                                                                        value={channel.id.toString()}>
                                                                                <div className="flex items-center gap-2 w-full">
                                                                                    <div className="text-muted-foreground scale-90">
                                                                                        {getNotificationChannelIcon(channel.provider)}
                                                                                    </div>
                                                                                    <span className="font-medium">{channel.name}</span>
                                                                                    <span
                                                                                        className="text-xs text-muted-foreground ml-2 capitalize">({channel.provider})</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="mt-1"/>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                 <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                                                    Status
                                                </Label>
                                                 <FormField
                                                    control={form.control}
                                                    name={`alertPolicies.${index}.enabled`}
                                                    render={({field}) => (
                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <div className="flex items-center h-9 px-3 rounded-md border border-input bg-background min-w-[90px] justify-between">
                                                                    <Label htmlFor={`switch-${index}`} className="text-xs cursor-pointer font-medium text-foreground mr-2">
                                                                        {field.value ? "Active" : "Off"}
                                                                    </Label>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        id={`switch-${index}`}
                                                                        className="scale-75 origin-right"
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col gap-1.5">
                                         
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors border-input bg-background"
                                                    onClick={() => removeAlertPolicy(index)}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`alertPolicies.${index}.eventKinds`}
                                            render={({field}) => (
                                                <FormItem className="space-y-1.5">
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger Events</FormLabel>
                                                    <FormControl>
                                                        <MultiSelect
                                                            options={EVENT_KIND_OPTIONS}
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value ?? []}
                                                            placeholder="Select events to trigger notifications..."
                                                            variant="inverted"
                                                            animation={0}
                                                            className="bg-background/50"
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t mt-2">
                <ButtonWithLoading variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </ButtonWithLoading>
                <ButtonWithLoading isPending={mutation.isPending}>
                    Save Changes
                </ButtonWithLoading>
            </div>
        </Form>
    );
};