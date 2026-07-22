"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { ArrowLeft, Check, X } from "lucide-react";
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
import { notificationProviders } from "@/features/channel/components/channels-notification-helper";
import { renderChannelForm } from "@/features/channel/components/channels-helpers";
import { NotificationChannelFormSchema } from "@/features/channel/schemas/channel-form.schema";
import { useAddNotifier } from "@/features/onboarding/hooks/use-add-notifier";
import { useRemoveNotifier } from "@/features/onboarding/hooks/use-remove-notifier";
import type { OnboardingChannel } from "@/features/onboarding/types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepNotifier = () => {
  const { next, updateContext, state } = useOnboarding();
  const notifiers = (state?.context.flowData.notifiers ??
    []) as OnboardingChannel[];
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });
  const form = useZodForm({ schema: NotificationChannelFormSchema });

  const addNotifier = useAddNotifier();
  const removeNotifier = useRemoveNotifier();

  const startConfiguring = (provider: string) => {
    if (notifiers.some((c) => c.provider === provider)) return;
    form.reset({ provider, enabled: true, name: "", config: {} } as any);
    setPhase({ kind: "configuring", provider });
  };

  const onContinue = async () => {
    await updateContext({
      flowData: { ...state?.context.flowData, notifiers },
    });
    await next();
  };

  if (phase.kind === "configuring") {
    const providerDetails = notificationProviders.find(
      (p) => p.value === phase.provider,
    );
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
            const details = notificationProviders.find(
              (p) => p.value === values.provider,
            );
            addNotifier.mutate(
              {
                provider: values.provider,
                name: values.name,
                config: values.config,
                label: details?.label ?? values.provider,
              },
              {
                onSuccess: () => {
                  form.reset({ enabled: true } as any);
                  setPhase({ kind: "grid" });
                },
              },
            );
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
          <Button type="submit" disabled={addNotifier.isPending}>
            {addNotifier.isPending ? "Saving…" : "Add channel"}
          </Button>
        </Form>
      </div>
    );
  }

  const configuredProviderIds = notifiers.map((c) => c.provider);
  const availableProviders = notificationProviders.filter((p) => !p.preview);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Connect a notifier</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — get notified about backups, restores and health checks.
        </p>
      </div>

      {notifiers.length > 0 && (
        <div className="flex flex-col gap-1">
          {notifiers.map((ch) => {
            const details = notificationProviders.find(
              (p) => p.value === ch.provider,
            );
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
                  {ch.name} <span className="opacity-60">({ch.label})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeNotifier.mutate(ch.id)}
                  disabled={removeNotifier.isPending}
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
                  <Check
                    className="size-3 text-primary-foreground"
                    strokeWidth={3}
                  />
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
