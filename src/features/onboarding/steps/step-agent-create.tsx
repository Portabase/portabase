"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { createAgentAction } from "@/features/agents/agents.action";
import { deleteAgentAction } from "@/features/agents/agent-delete.action";
import type { OnboardingAgent, OnboardingDefaultsData } from "@/features/onboarding/types";

export const StepAgentCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const defaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
    const agents = (state?.context.flowData.agents ?? []) as OnboardingAgent[];
    const orgId = (state?.context.flowData.org as any)?.id as string | undefined;


    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);

    const addAgent = async () => {
        if (!name.trim()) return;
        if (!orgId) {
            toast.error("Missing org ID — cannot create agent");
            return;
        }
        setAdding(true);
        try {
            const result = await createAgentAction({
                organizationId: orgId,
                data: { name: name.trim(), description: "" },
            });
            if (!result?.data?.data) {
                toast.error(result?.serverError ?? `Failed to create agent "${name.trim()}"`);
                return;
            }
            const newAgent: OnboardingAgent = {
                id: result.data.data.id,
                name: result.data.data.name,
                notifierId: defaults.notifierId,
                storageId: defaults.storageId,
            };
            const updated = [...agents, newAgent];
            setName("");
            await updateContext({ flowData: { ...state?.context.flowData, agents: updated } });
        } finally {
            setAdding(false);
        }
    };

    const removeAgent = async (id: string) => {
        const updated = agents.filter((a) => a.id !== id);
        const result = await deleteAgentAction({ agentId: id, organizationId: orgId });
        if (result?.data?.success === false) {
            toast.error("Failed to delete agent");
        } else {
            await updateContext({ flowData: { ...state?.context.flowData, agents: updated } });
        }
    };

    const onContinue = async () => {
        await next();
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
                                onClick={() => removeAgent(agent.id)}
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
                    onKeyDown={(e) => e.key === "Enter" && addAgent()}
                    disabled={adding}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={addAgent}
                    disabled={adding || !name.trim()}
                >
                    {adding ? "Adding…" : "Add"}
                </Button>
            </div>

            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
