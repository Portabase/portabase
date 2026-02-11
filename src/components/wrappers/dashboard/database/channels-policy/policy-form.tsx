import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {InfoIcon, Plus, Trash2} from "lucide-react";
import {useFieldArray} from "react-hook-form";
import {DatabaseWith} from "@/db/schema/07_database";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {MultiSelect} from "@/components/wrappers/common/multiselect/multi-select";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {Switch} from "@/components/ui/switch";
import {Card} from "@/components/ui/card";
import Link from "next/link";
import {useIsMobile} from "@/hooks/use-mobile";
import {
    ChannelKind,
    getChannelIcon,
    getChannelTextBasedOnKind
} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {
    EVENT_KIND_OPTIONS,
    PoliciesSchema,
    PoliciesType,
    PolicyType
} from "@/components/wrappers/dashboard/database/channels-policy/policy.schema";
import {
    createAlertPoliciesAction, createStoragePoliciesAction, deleteAlertPoliciesAction, deleteStoragePoliciesAction,
    updateAlertPoliciesAction, updateStoragePoliciesAction
} from "@/components/wrappers/dashboard/database/channels-policy/policy.action";

type ChannelPoliciesFormProps = {
    onSuccess?: () => void;
    channels: NotificationChannel[] | StorageChannel[];
    organizationId: string;
    database: DatabaseWith;
    kind: ChannelKind
};


export const ChannelPoliciesForm = ({
                                        database,
                                        channels,
                                        organizationId,
                                        onSuccess,
                                        kind
                                    }: ChannelPoliciesFormProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const channelText = getChannelTextBasedOnKind(kind);

    const organizationChannels = channels.map(c => c.id);

    const filterByChannel = <T, K extends keyof T>(
        items: T[] | undefined | null,
        channelKey: K
    ): T[] => items?.filter(item => organizationChannels.includes(item[channelKey] as string)) ?? [];

    const formattedAlertPolicies = filterByChannel(database.alertPolicies, "notificationChannelId")
        .map(({notificationChannelId, eventKinds, enabled}) => ({
            channelId: notificationChannelId,
            eventKinds,
            enabled
        }));

    const formattedStoragePolicies = filterByChannel(database.storagePolicies, "storageChannelId")
        .map(({storageChannelId, enabled}) => ({
            channelId: storageChannelId,
            enabled
        }));

    const defaultPolicies: PolicyType[] =
        kind === "notification"
            ? formattedAlertPolicies
            : formattedStoragePolicies.map(({ channelId, enabled }) => ({ channelId, enabled }));

    const form = useZodForm({
        schema: PoliciesSchema,
        defaultValues: { policies: defaultPolicies },
        context: { kind }
    });

    const {fields, append, remove} = useFieldArray({ control: form.control, name: "policies" });

    const addPolicy = () => append({channelId: "", eventKinds: [], enabled: true});
    const removePolicyHandler = (index: number) => remove(index);
    const onCancel = () => { form.reset(); onSuccess?.(); };

    const mutation = useMutation({
        mutationFn: async ({policies}: PoliciesType) => {
            const payload = policies.map(p => kind === "notification" ? p : { ...p, eventKinds: undefined });

            const policiesToAdd = payload.filter(
                (policy) => !defaultPolicies.some((a) => a.channelId === policy.channelId)
            );
            const policiesToRemove = defaultPolicies.filter(
                (policy) => !payload.some((v) => v.channelId === policy.channelId)
            );
            const policiesToUpdate = payload.filter((policy) => {
                const existing = defaultPolicies.find((a) => a.channelId === policy.channelId);
                return existing &&
                    (existing.eventKinds !== policy.eventKinds || existing.enabled !== policy.enabled);
            });




            const promises = kind === "notification"
                ? [
                    policiesToAdd.length > 0 ? await createAlertPoliciesAction({databaseId: database.id, alertPolicies: policiesToAdd}) : null,
                    policiesToUpdate.length > 0 ? await updateAlertPoliciesAction({databaseId: database.id, alertPolicies: policiesToUpdate}) : null,
                    policiesToRemove.length > 0 ? await deleteAlertPoliciesAction({databaseId: database.id, alertPolicies: policiesToRemove}) : null,
                ]
                : [
                    policiesToAdd.length > 0 ? await createStoragePoliciesAction({databaseId: database.id, storagePolicies: policiesToAdd}) : null,
                    policiesToUpdate.length > 0 ? await updateStoragePoliciesAction({databaseId: database.id, storagePolicies: policiesToUpdate}) : null,
                    policiesToRemove.length > 0 ? await deleteStoragePoliciesAction({databaseId: database.id, storagePolicies: policiesToRemove}) : null,
                ];

            const results = await Promise.allSettled(promises);
            const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
            if (rejected) throw new Error(rejected.reason?.message || "Network or server error");

            const failedActions = results
                .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
                .map(r => r.value)
                .filter((v): v is { data: { success: false; actionError: any } } => v !== null && v.data?.success === false);

            if (failedActions.length > 0) throw new Error(failedActions[0].data.actionError?.message || "One or more operations failed");
            return {success: true};
        },
        onSuccess: () => { toast.success("Policies saved successfully"); router.refresh(); },
        onError: (error: any) => { toast.error(error.message || "Failed to save policies"); },
    });

    return (
        <Form form={form} className="flex flex-col gap-6" onSubmit={
            async (values) => {

                if (kind === "notification") {
                    for (const policy of values.policies) {
                        if (!policy.eventKinds || policy.eventKinds.length === 0) {
                            toast.error("Please select at least one event for all notification policies");
                            return;
                        }
                    }
                }

                await mutation.mutateAsync(values)
            }
        }>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base font-medium">
                            Configure {kind === "notification" ? "Alerts" : "Storages"}
                        </Label>
                        {!isMobile && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {kind === "notification"
                                    ? "Choose which channels receive notifications for specific events."
                                    : "Choose which storage to use with your database"}
                            </p>
                        )}
                    </div>
                    <Button
                        disabled={fields.length >= channels.length || channels.length === 0}
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={addPolicy}>
                        <Plus className="w-4 h-4 mr-1.5"/> Add Policy
                    </Button>
                </div>

                <div className="space-y-3 w-full">
                    {channels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <InfoIcon className="h-8 w-8 text-muted-foreground/50"/>
                            <p className="font-medium text-sm text-foreground">No channels</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Please <Link href={`/dashboard/settings`} className="underline underline-offset-4 hover:text-primary transition-colors">
                                configure {channelText.toLowerCase()} channels
                            </Link> in your organization settings first.
                            </p>
                        </div>
                    ) : fields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-primary"/>
                            </div>
                            <p className="font-medium text-sm text-foreground">No policies</p>
                            <p className="text-xs text-muted-foreground">
                                {kind === "notification" ? `Click "Add Policy" to start receiving notifications.` : `Click "Add Policy" to use this storage.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 transition-all hover:border-primary/50 relative group min-w-0 overflow-hidden">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-row gap-2 items-start md:items-end flex-nowrap min-w-0 ">
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                                                    {channelText} Channel
                                                </Label>
                                                <FormField
                                                    control={form.control}
                                                    name={`policies.${index}.channelId`}
                                                    render={({field}) => {
                                                        const selectedIds = form.watch("policies").map((a: PolicyType) => a.channelId).filter(Boolean);
                                                        const availableChannels = channels.filter(
                                                            (channel) => channel.id.toString() === field.value?.toString() || !selectedIds.includes(channel.id.toString())
                                                        );
                                                        const selectedChannel = channels.find(c => c.id === field.value);

                                                        return (
                                                            <FormItem className="space-y-0 min-w-0">
                                                                <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-9 w-full bg-background border-input min-w-0">
                                                                            <SelectValue placeholder="Select channel">
                                                                                {selectedChannel && (
                                                                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                                                                        <div className="flex items-center justify-center h-4 w-4 shrink-0">
                                                                                            {getChannelIcon(selectedChannel.provider)}
                                                                                        </div>
                                                                                        <span className="truncate font-medium text-sm min-w-0">
                                                                                            {selectedChannel.name}
                                                                                        </span>
                                                                                        <span className="shrink-0 text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono uppercase">
                                                                                            {selectedChannel.provider}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {availableChannels.map(channel => (
                                                                            <SelectItem key={channel.id.toString()} value={channel.id.toString()}>
                                                                                <div className="flex items-center gap-2 w-full min-w-0">
                                                                                    <div className="text-muted-foreground scale-90 shrink-0">{getChannelIcon(channel.provider)}</div>
                                                                                    <span className="font-medium truncate min-w-0">{channel.name}</span>
                                                                                    <span className="text-xs text-muted-foreground ml-2 capitalize shrink-0">({channel.provider})</span>
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

                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Status</Label>
                                                <FormField
                                                    control={form.control}
                                                    name={`policies.${index}.enabled`}
                                                    render={({field}) => (
                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <div className="flex items-center h-9 px-1 md:px-3 rounded-md border border-input bg-background justify-between min-w-0">
                                                                    {!isMobile && (
                                                                        <Label htmlFor={`switch-${index}`} className="text-xs cursor-pointer font-medium text-foreground mr-2">
                                                                            {field.value ? "Active" : "Off"}
                                                                        </Label>
                                                                    )}
                                                                    <Switch checked={field.value} onCheckedChange={field.onChange} id={`switch-${index}`} className="scale-75 origin-right"/>
                                                                </div>
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5 shrink-0 mt-auto">
                                                <Button type="button" variant="outline" size="icon"
                                                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors border-input bg-background"
                                                        onClick={() => removePolicyHandler(index)}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </div>

                                        {kind === "notification" && (
                                            <FormField
                                                control={form.control}
                                                name={`policies.${index}.eventKinds`}
                                                render={({field}) => (
                                                    <FormItem className="space-y-1.5 min-w-0">
                                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger Events</FormLabel>
                                                        <FormControl>
                                                            <div className="max-w-full overflow-hidden">
                                                                <MultiSelect
                                                                    options={EVENT_KIND_OPTIONS}
                                                                    onValueChange={field.onChange}
                                                                    defaultValue={field.value ?? []}
                                                                    placeholder={isMobile ? "Select events..." : "Select events to trigger notifications..."}
                                                                    variant="inverted"
                                                                    animation={0}
                                                                    className="bg-background/50 w-full min-w-0 flex-wrap"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t mt-2">
                <ButtonWithLoading variant="outline" type="button" onClick={onCancel}>Cancel</ButtonWithLoading>
                <ButtonWithLoading isPending={mutation.isPending}>Save Changes</ButtonWithLoading>
            </div>
        </Form>
    );
};