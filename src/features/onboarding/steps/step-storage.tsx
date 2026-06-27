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
import { storageProviders } from "@/features/channel/components/channels-storage-helper";
import { renderChannelForm } from "@/features/channel/components/channels-helpers";
import { StorageChannelFormSchema } from "@/features/channel/schemas/channel-form.schema";
import { useAddStorage } from "@/features/onboarding/hooks/use-add-storage";
import { useRemoveStorage } from "@/features/onboarding/hooks/use-remove-storage";
import type { OnboardingChannel } from "@/features/onboarding/types";

type Phase = { kind: "grid" } | { kind: "configuring"; provider: string };

export const StepStorage = () => {
  const { next, updateContext, state } = useOnboarding();
  const storages = (state?.context.flowData.storages ??
    []) as OnboardingChannel[];
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });
  const form = useZodForm({ schema: StorageChannelFormSchema });

  const addStorage = useAddStorage();
  const removeStorage = useRemoveStorage();

  const startConfiguring = (provider: string) => {
    if (storages.some((c) => c.provider === provider)) return;
    form.reset({ provider, enabled: true, name: "", config: {} } as any);
    setPhase({ kind: "configuring", provider });
  };

  const onContinue = async () => {
    await updateContext({ flowData: { ...state?.context.flowData, storages } });
    await next();
  };

  if (phase.kind === "configuring") {
    const providerDetails = storageProviders.find(
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
            const details = storageProviders.find(
              (p) => p.value === values.provider,
            );
            addStorage.mutate(
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
                    placeholder={`e.g. ${providerDetails?.label ?? ""} backup`}
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
          <Button type="submit" disabled={addStorage.isPending}>
            {addStorage.isPending ? "Saving…" : "Add storage"}
          </Button>
        </Form>
      </div>
    );
  }

  const availableProviders = storageProviders.filter(
    (p) => !p.preview && p.value !== "local",
  );
  const configuredProviderIds = storages.map((c) => c.provider);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Connect an external storage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — link an S3-compatible bucket or other external storage to keep your backups safe and off-instance.
        </p>
      </div>

      {storages.length > 0 && (
        <div className="flex flex-col gap-1">
          {storages.map((ch) => {
            const details = storageProviders.find(
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
                {ch.organizationId !== null && (
                  <button
                    type="button"
                    onClick={() => removeStorage.mutate(ch.id)}
                    disabled={removeStorage.isPending}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="size-4" />
                  </button>
                )}
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
