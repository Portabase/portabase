"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { deleteAgentAction } from "@/features/agents/actions/agent-delete.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const useDeleteAgent = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      const result = await deleteAgentAction({ agentId, organizationId: orgId });
      if (result?.data?.success === false) throw new Error("Failed to delete agent");

      const agents = (
        (state?.context.flowData.agents ?? []) as OnboardingAgent[]
      ).filter((a) => a.id !== agentId);
      await updateContext({ flowData: { ...state?.context.flowData, agents } });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
