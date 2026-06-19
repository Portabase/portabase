"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAgentStatusAction } from "@/features/onboarding/actions/get-agent-status.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentWaiting = () => {
    const { next, state } = useOnboarding();
    const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
    const firstAgentId = agents[0]?.id;

    const { data } = useQuery({
        queryKey: ["agent-status", firstAgentId],
        queryFn: async () => {
            if (!firstAgentId) return { connected: false };
            const result = await getAgentStatusAction({ agentId: firstAgentId });
            return result?.data ?? { connected: false };
        },
        refetchInterval: 3000,
        enabled: !!firstAgentId,
    });

    useEffect(() => {
        if (data?.connected) {
            next();
        }
    }, [data?.connected, next]);

    return (
        <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
            <Loader2 className="size-10 animate-spin text-primary" />
            <h1 className="text-xl font-semibold">Waiting for your agent</h1>
            <p className="text-sm text-muted-foreground">
                Checking connectivity every 3 seconds…
            </p>
            {agents.length > 0 && (
                <p className="text-xs text-muted-foreground">Agent: {agents[0].name}</p>
            )}
        </div>
    );
};
