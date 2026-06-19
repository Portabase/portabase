// src/features/onboarding/steps/step-notifier.tsx
"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useZodForm,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { notificationProviders } from "@/features/channel/channels-notification-helper";
import { renderChannelForm } from "@/features/channel/channels-helpers";
import { NotificationChannelFormSchema } from "@/features/channel/channel-form.schema";
import { OnboardingChannel } from "@/features/onboarding/types";
import { addNotificationChannelAction, removeNotificationChannelAction } from "@/features/channel/notifications/channel.action";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepNotifier = () => {
    const { next, updateContext, state } = useOnboarding();
    const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
    const [phase, setPhase] = useState<Phase>({ kind: "grid" });
    const existingNotifiers = (state?.context.flowData.notifiers ?? []) as OnboardingChannel[];
    const [channels, setChannels] = useState<OnboardingChannel[]>(existingNotifiers);
    const [submitting, setSubmitting] = useState(false);

    const form = useZodForm({ schema: NotificationChannelFormSchema });

    const startConfiguring = (provider: string) => {
        if (channels.some((c) => c.provider === provider)) return;
        form.reset({ provider, enabled: true, name: "", config: {} } as any);
        setPhase({ kind: "configuring", provider });
    };

    const removeChannel = async (id: string) => {
        const updated = channels.filter((c) => c.id !== id);
        setChannels(updated);
        const result = await removeNotificationChannelAction({ organizationId: orgId, notificationChannelId: id });
        if (result?.data?.success === false) {
            toast.error("Failed to remove channel");
            setChannels(channels);
        } else {
            await updateContext({ flowData: { ...state?.context.flowData, notifiers: updated } });
        }
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, notifiers: channels } });
        await next();
    };

    if (phase.kind === "configuring") {
        const providerDetails = notificationProviders.find((p) => p.value === phase.provider);
        const Icon = providerDetails?.icon;

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                    {Icon && (
                        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center">
                            <Icon className="size-5" />
                        </div>
                    )}
                    <p className="flex-1 text-sm font-medium">
                        Configuring {providerDetails?.label}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhase({ kind: "grid" })}
                    >
                        <ArrowLeft className="size-4 mr-1" />
                        Back
                    </Button>
                </div>
                <Form
                    form={form}
                    className="flex flex-col gap-4"
                    onSubmit={async (values: any) => {
                        setSubmitting(true);
                        try {
                            const details = notificationProviders.find((p) => p.value === values.provider);
                            const result = await addNotificationChannelAction({
                                organizationId: orgId,
                                data: { provider: values.provider as any, name: values.name, config: values.config as any, enabled: true },
                            });
                            const inner = result?.data;
                            if (!inner?.success || !inner.value) {
                                toast.error("Failed to save channel");
                                return;
                            }
                            setChannels((prev) => [
                                ...prev,
                                {
                                    id: inner.value!.id,
                                    provider: values.provider,
                                    label: details?.label ?? values.provider,
                                    name: values.name,
                                    config: values.config as Record<string, unknown>,
                                },
                            ]);
                            form.reset({ enabled: true } as any);
                            setPhase({ kind: "grid" });
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Channel name *</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder={`e.g. ${providerDetails?.label ?? ""} alerts`}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="provider"
                        render={({ field }) => (
                            <input type="hidden" {...field} value={field.value || ""} />
                        )}
                    />
                    {renderChannelForm(phase.provider, form)}
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving…" : "Add channel"}
                    </Button>
                </Form>
            </div>
        );
    }

    // Phase: grid
    const configuredProviderIds = channels.map((c) => c.provider);
    const availableProviders = notificationProviders.filter((p) => !p.preview);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Connect a notifier</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Optional — get notified about backups, restores and health checks.
                </p>
            </div>

            {channels.length > 0 && (
                <div className="flex flex-col gap-1">
                    {channels.map((ch) => {
                        const details = notificationProviders.find((p) => p.value === ch.provider);
                        const Icon = details?.icon;
                        return (
                            <div
                                key={ch.id}
                                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm text-primary"
                            >
                                {Icon && (
                                    <div className="size-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                                        <Icon className="size-4" />
                                    </div>
                                )}
                                <span className="flex-1 truncate">
                                    {ch.name}{" "}
                                    <span className="opacity-60">({ch.label})</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeChannel(ch.id)}
                                    className="opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {availableProviders.map((provider) => {
                    const Icon = provider.icon;
                    const isConfigured = configuredProviderIds.includes(provider.value);
                    return (
                        <button
                            key={provider.value}
                            type="button"
                            onClick={() => startConfiguring(provider.value)}
                            className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                                isConfigured
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent/50 hover:border-primary/20"
                            }`}
                        >
                            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                <Icon className="size-4" />
                            </div>
                            <span className="flex-1 text-left">{provider.label}</span>
                            {isConfigured && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
