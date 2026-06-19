"use client";

import { useQuery } from "@tanstack/react-query";
import { generateEdgeKey } from "@/utils/edge_key";
import { getServerUrl } from "@/utils/get-server-url";

export const useGenerateEdgeKey = (agentId: string) => {
  return useQuery({
    queryKey: ["onboarding-edge-key", agentId],
    queryFn: async () => {
      const serverUrl = getServerUrl();
      const key = await generateEdgeKey(serverUrl, agentId);
      if (!key) throw new Error("Failed to generate key");
      return key;
    },
    staleTime: Infinity,
    enabled: !!agentId,
  });
};
