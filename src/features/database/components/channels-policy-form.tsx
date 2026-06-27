"use client";

import { ReactNode } from "react";
import { InfoIcon, Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/common/multi-select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChannelKind, getChannelIcon, getChannelTextBasedOnKind } from "@/features/channel/components/channels-helpers";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import {
    EVENT_KIND_BACKUP_ONLY_OPTIONS,
    EVENT_KIND_OPTIONS,
    PoliciesSchema,
    PoliciesType,
    PolicyType,
} from "@/features/database/schemas/channels-policy.schema";

export type ChannelEntry = { id: string; name: string; provider: string };

type ChannelPoliciesFormProps = {
    channels: ChannelEntry[];
    defaultPolicies: PolicyType[];
    kind: ChannelKind;
    isBackupOnly?: boolean;
    isPending?: boolean;
    onSave: (policies: PolicyType[]) => Promise<void>;
    onCancel?: () => void;
    noChannelsMessage?: ReactNode;
};

export const ChannelPoliciesForm = ({
    channels,
    defaultPolicies,
    kind,
    isBackupOnly = false,
    isPending = false,
    onSave,
    onCancel,
    noChannelsMessage,
}: ChannelPoliciesFormProps) => {
    const isMobile = useIsMobile();
    const channelText = getChannelTextBasedOnKind(kind);

    const form = useZodForm({
        schema: PoliciesSchema,
        defaultValues: { policies: defaultPolicies },
        context: { kind },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "policies" });

    const addPolicy = () => append({ channelId: "", eventKinds: [], enabled: true });

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    };

    return (
        <Form
            form={form}
            className="flex flex-col gap-6"
            onSubmit={async (values) => {
                if (kind === "notification") {
                    for (const policy of values.policies) {
                        if (!policy.eventKinds || policy.eventKinds.length === 0) {
                            toast.error("Please select at least one event for all notification policies");
                            return;
                        }
                    }
                }
                await onSave(values.policies);
            }}
        >
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
                        onClick={addPolicy}
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Policy
                    </Button>
                </div>

                <div className="space-y-3 w-full">
                    {channels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <InfoIcon className="h-8 w-8 text-muted-foreground/50" />
                            <p className="font-medium text-sm text-foreground">No channels</p>
                            {noChannelsMessage ?? (
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    No {channelText.toLowerCase()} channels configured.
                                </p>
                            )}
                        </div>
                    ) : fields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-primary" />
                            </div>
                            <p className="font-medium text-sm text-foreground">No policies</p>
                            <p className="text-xs text-muted-foreground">
                                {kind === "notification"
                                    ? `Click "Add Policy" to start receiving notifications.`
                                    : `Click "Add Policy" to use this storage.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {fields.map((field, index) => (
                                <Card
                                    key={field.id}
                                    className="p-4 transition-all hover:border-primary/50 relative group min-w-0 overflow-hidden"
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-row gap-2 items-start md:items-end flex-nowrap min-w-0">
                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                                                    {channelText} Channel
                                                </Label>
                                                <FormField
                                                    control={form.control}
                                                    name={`policies.${index}.channelId`}
                                                    render={({ field }) => {
                                                        const selectedIds = form
                                                            .watch("policies")
                                                            .map((a: PolicyType) => a.channelId)
                                                            .filter(Boolean);
                                                        const available = channels.filter(
                                                            (c) =>
                                                                c.id.toString() === field.value?.toString() ||
                                                                !selectedIds.includes(c.id.toString()),
                                                        );
                                                        const selected = channels.find((c) => c.id === field.value);

                                                        return (
                                                            <FormItem className="space-y-0 min-w-0">
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value?.toString() || ""}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-9 w-full bg-background border-input min-w-0">
                                                                            <SelectValue placeholder="Select channel">
                                                                                {selected && (
                                                                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                                                                        <div className="flex items-center justify-center h-4 w-4 shrink-0">
                                                                                            {getChannelIcon(selected.provider)}
                                                                                        </div>
                                                                                        <span className="truncate font-medium text-sm min-w-0">
                                                                                            {selected.name}
                                                                                        </span>
                                                                                        <span className="shrink-0 text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono uppercase">
                                                                                            {selected.provider}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {available.map((c) => (
                                                                            <SelectItem key={c.id.toString()} value={c.id.toString()}>
                                                                                <div className="flex items-center gap-2 w-full min-w-0">
                                                                                    <div className="text-muted-foreground scale-90 shrink-0">
                                                                                        {getChannelIcon(c.provider)}
                                                                                    </div>
                                                                                    <span className="font-medium truncate min-w-0">{c.name}</span>
                                                                                    <span className="text-xs text-muted-foreground ml-2 capitalize shrink-0">
                                                                                        ({c.provider})
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="mt-1" />
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                                                    Status
                                                </Label>
                                                <FormField
                                                    control={form.control}
                                                    name={`policies.${index}.enabled`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0">
                                                            <FormControl>
                                                                <div className="flex items-center h-9 px-1 md:px-3 rounded-md border border-input bg-background justify-between min-w-0">
                                                                    {!isMobile && (
                                                                        <Label
                                                                            htmlFor={`switch-${index}`}
                                                                            className="text-xs cursor-pointer font-medium text-foreground mr-2"
                                                                        >
                                                                            {field.value ? "Active" : "Off"}
                                                                        </Label>
                                                                    )}
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

                                            <div className="flex flex-col gap-1.5 shrink-0 mt-auto">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-colors border-input bg-background"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {kind === "notification" && (
                                            <FormField
                                                control={form.control}
                                                name={`policies.${index}.eventKinds`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-1.5 min-w-0">
                                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Trigger Events
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="max-w-full overflow-hidden">
                                                                <MultiSelect
                                                                    options={isBackupOnly ? EVENT_KIND_BACKUP_ONLY_OPTIONS : EVENT_KIND_OPTIONS}
                                                                    onValueChange={field.onChange}
                                                                    defaultValue={field.value ?? []}
                                                                    placeholder={
                                                                        isMobile
                                                                            ? "Select events..."
                                                                            : "Select events to trigger notifications..."
                                                                    }
                                                                    variant="inverted"
                                                                    animation={0}
                                                                    className="bg-background/50 w-full min-w-0 flex-wrap"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
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
                {onCancel && (
                    <ButtonWithLoading variant="outline" type="button" onClick={handleCancel}>
                        Cancel
                    </ButtonWithLoading>
                )}
                <ButtonWithLoading isPending={isPending}>Save Changes</ButtonWithLoading>
            </div>
        </Form>
    );
};
