"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { addNotificationChannelAction } from "@/features/channel/components/notifications/channel.action";
import { updateNotificationChannelsOrganizationAction } from "@/features/organizations/actions/channels-organization.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

type NotifierInput = {
  provider: string;
  name: string;
  config: Record<string, unknown>;
  label: string;
};

export const useAddNotifier = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async ({ provider, name, config, label }: NotifierInput) => {
      const orgId = (state?.context.flowData.org as any)?.id as
        | string
        | undefined;
      const result = await addNotificationChannelAction({
        data: {
          provider: provider as any,
          name,
          config: config as any,
          enabled: true,
        },
      });
      const inner = result?.data;
      if (!inner?.success || !inner.value)
        throw new Error("Failed to save channel");

      if (orgId) {
        const association = await updateNotificationChannelsOrganizationAction({
          id: inner.value.id,
          data: [orgId],
        });
        if (association?.data?.success === false)
          throw new Error("Failed to attach channel to the organization");
      }

      const channel: OnboardingChannel = {
        id: inner.value.id,
        provider,
        label,
        name,
        config,
      };
      const notifiers = [
        ...((state?.context.flowData.notifiers ?? []) as OnboardingChannel[]),
        channel,
      ];
      await updateContext({
        flowData: { ...state?.context.flowData, notifiers },
      });
      return channel;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
