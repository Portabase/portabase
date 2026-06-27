"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCardKey } from "@/features/agents/components/agent-card-key";
import type { OnboardingAgent } from "@/features/onboarding/types";
import { cn } from "@/lib/utils";

export const StepAgentKey = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
  const [selectedId, setSelectedId] = useState<string>(agents[0]?.id ?? "");

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Connect your agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run the command below on your server. The next step waits for the
          agent to connect.
        </p>
      </div>

      {agents.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Agents
          </p>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto scrollbar-hide">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-all text-left",
                  selectedId === agent.id
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border hover:bg-accent/50 hover:border-primary/20",
                )}
              >
                <Server className="size-3.5 shrink-0" />
                <span className="font-medium truncate">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected?.edgeKey && (
        <AgentCardKey edgeKey={selected.edgeKey} agentName={selected.name} />
      )}

      <Button type="button" onClick={() => next()}>
        I&apos;ve run the command →
      </Button>
    </div>
  );
};
