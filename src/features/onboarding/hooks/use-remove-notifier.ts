"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { removeNotificationChannelAction } from "@/features/channel/components/notifications/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

export const useRemoveNotifier = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as
        | string
        | undefined;
      const result = await removeNotificationChannelAction({
        organizationId: orgId,
        notificationChannelId: id,
      });
      if (result?.data?.success === false)
        throw new Error("Failed to remove channel");
      const notifiers = (
        (state?.context.flowData.notifiers ?? []) as OnboardingChannel[]
      ).filter((c) => c.id !== id);
      await updateContext({
        flowData: { ...state?.context.flowData, notifiers },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
