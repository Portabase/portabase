"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { addStorageChannelAction } from "@/features/channel/components/storages/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

type StorageInput = {
  provider: string;
  name: string;
  config: Record<string, unknown>;
  label: string;
};

export const useAddStorage = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async ({ provider, name, config, label }: StorageInput) => {
      const orgId = (state?.context.flowData.org as any)?.id as
        | string
        | undefined;
      const result = await addStorageChannelAction({
        organizationId: orgId,
        data: {
          provider: provider as any,
          name,
          config: config as any,
          enabled: true,
        },
      });
      const inner = result?.data;
      if (!inner?.success || !inner.value)
        throw new Error("Failed to save storage");

      const channel: OnboardingChannel = {
        id: inner.value.id,
        provider,
        label,
        name,
        config,
        organizationId: orgId ?? null,
      };
      const storages = [
        ...((state?.context.flowData.storages ?? []) as OnboardingChannel[]),
        channel,
      ];
      await updateContext({
        flowData: { ...state?.context.flowData, storages },
      });
      return channel;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
