"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { createAgentAction } from "@/features/agents/agents.action";
import type { OnboardingAgent, OnboardingDefaultsData } from "@/features/onboarding/types";
import { generateEdgeKey } from "@/utils/edge_key";
import { getServerUrl } from "@/utils/get-server-url";

export const useCreateAgent = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async (name: string) => {
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      if (!orgId) throw new Error("Missing org ID — cannot create agent");

      const defaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
      const result = await createAgentAction({
        organizationId: orgId,
        data: { name, description: "" },
      });
      if (!result?.data?.data) {
        throw new Error(result?.serverError ?? `Failed to create agent "${name}"`);
      }

      const edgeKey = await generateEdgeKey(getServerUrl(), result.data.data.id);

      const newAgent: OnboardingAgent = {
        id: result.data.data.id,
        name: result.data.data.name,
        edgeKey,
        notifierId: defaults.notifierId,
        storageId: defaults.storageId,
      };
      const agents = [
        ...((state?.context.flowData.agents ?? []) as OnboardingAgent[]),
        newAgent,
      ];
      await updateContext({ flowData: { ...state?.context.flowData, agents } });
      return newAgent;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
