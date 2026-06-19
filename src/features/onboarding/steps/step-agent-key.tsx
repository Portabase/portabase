"use client";

import { useOnboarding } from "@onboardjs/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeSnippet } from "@/components/common/code-snippet";
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
  if (!agent.edgeKey) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-lg border border-border bg-muted/50">
        <Loader2 className="size-4 animate-spin" />
        Generating key for {agent.name}…
      </div>
    );
  }

  const command = `portabase agent "${agent.name}" --key ${agent.edgeKey}`;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
      <p className="text-sm font-medium">{agent.name}</p>
      <CodeSnippet title="Installation Command" code={command} />
      <CodeSnippet title="Agent Key (manual)" code={agent.edgeKey} />
    </div>
  );
};
