"use client";

import { useOnboarding } from "@onboardjs/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CodeSnippet } from "@/components/common/code-snippet";
import { generateEdgeKeyAction } from "@/features/onboarding/actions/generate-edge-key.action";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentKey = () => {
    const { next, state } = useOnboarding();
    const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Connect your agent</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Run the command below on your server. The next step waits for the agent to connect.
                </p>
            </div>
            {agents.map((agent) => (
                <AgentKeyBlock key={agent.id} agent={agent} />
            ))}
            <Button type="button" onClick={() => next()}>
                I&apos;ve run the command →
            </Button>
        </div>
    );
};

const AgentKeyBlock = ({ agent }: { agent: OnboardingAgent }) => {
    const { data, isLoading } = useQuery({
        queryKey: ["edge-key", agent.id],
        queryFn: async () => {
            const result = await generateEdgeKeyAction({ agentId: agent.id });
            if (!result?.data?.key) throw new Error("Failed to generate key");
            return result.data.key;
        },
        staleTime: Infinity,
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating key for {agent.name}…
            </div>
        );
    }

    const command = `portabase agent "${agent.name}" --key ${data}`;

    return (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
            <p className="text-sm font-medium">{agent.name}</p>
            <CodeSnippet title="Installation Command" code={command} />
            <CodeSnippet title="Agent Key (manual)" code={data ?? ""} />
        </div>
    );
};
