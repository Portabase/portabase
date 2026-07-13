"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { removeStorageChannelAction } from "@/features/channel/components/storages/channel.action";
import type { OnboardingChannel } from "@/features/onboarding/types";

export const useRemoveStorage = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (id: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as
        | string
        | undefined;
      const result = await removeStorageChannelAction({
        organizationId: orgId,
        id,
      });
      if (result?.data?.success === false)
        throw new Error("Failed to remove storage");
      const storages = (
        (state?.context.flowData.storages ?? []) as OnboardingChannel[]
      ).filter((c) => c.id !== id);
      await updateContext({
        flowData: { ...state?.context.flowData, storages },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
