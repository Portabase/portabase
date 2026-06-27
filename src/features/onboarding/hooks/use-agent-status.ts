"use client";

import { useQuery } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { getAgentStatusAction } from "@/features/onboarding/actions/get-agent-status.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const useAgentStatus = () => {
  const { state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
  const firstAgentId = agents[0]?.id;

  return useQuery({
    queryKey: ["onboarding-agent-status", firstAgentId],
    queryFn: async () => {
      if (!firstAgentId) return { connected: false };
      const result = await getAgentStatusAction({ agentId: firstAgentId });
      return result?.data ?? { connected: false };
    },
    refetchInterval: 3_000,
    enabled: !!firstAgentId,
  });
};
