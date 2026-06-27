"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateAgent } from "@/features/onboarding/hooks/use-create-agent";
import { useDeleteAgent } from "@/features/onboarding/hooks/use-delete-agent";
import type { OnboardingAgent } from "@/features/onboarding/types";

export const StepAgentCreate = () => {
  const { next, state } = useOnboarding();
  const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];

  const [name, setName] = useState("");
  const createAgent = useCreateAgent();
  const deleteAgent = useDeleteAgent();

  const onAdd = () => {
    if (!name.trim()) return;
    createAgent.mutate(name.trim(), { onSuccess: () => setName("") });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Create an agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — agents will use your default notifier and storage.
        </p>
      </div>

      {agents.length > 0 && (
        <div className="flex flex-col gap-1">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-2 text-sm text-primary"
            >
              <span className="flex-1 truncate">{agent.name}</span>
              <button
                type="button"
                onClick={() => deleteAgent.mutate(agent.id)}
                disabled={deleteAgent.isPending}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="agent-prod"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          disabled={createAgent.isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={createAgent.isPending || !name.trim()}
        >
          {createAgent.isPending ? "Adding…" : "Add"}
        </Button>
      </div>

      <Button type="button" onClick={() => next()}>
        Continue
      </Button>
    </div>
  );
};
