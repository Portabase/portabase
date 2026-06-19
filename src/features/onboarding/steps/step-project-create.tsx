"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createProjectAction, updateProjectAction } from "@/features/projects/projects.action";
import type { OnboardingDatabase, OnboardingProjectData } from "@/features/onboarding/types";

export const StepProjectCreate = () => {
    const { next, updateContext, state } = useOnboarding();
    const existingProject = state?.context.flowData.project as OnboardingProjectData | undefined;
    const databases = (state?.context.flowData.databases ?? []) as OnboardingDatabase[];
    const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
    const isUpdateMode = !!existingProject;

    const [name, setName] = useState(existingProject?.name ?? "");
    const [description, setDescription] = useState(existingProject?.description ?? "");
    const [databaseIds, setDatabaseIds] = useState<string[]>(existingProject?.databaseIds ?? []);

    const toggleDb = (id: string) => {
        setDatabaseIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            if (!orgId) throw new Error("No organisation ID found");
            if (isUpdateMode && existingProject?.id) {
                const result = await updateProjectAction({
                    data: { name: name.trim(), databases: databaseIds },
                    organizationId: orgId,
                    projectId: existingProject.id,
                });
                const updateData = result?.data;
                if (!updateData?.success) {
                    throw new Error(updateData?.actionError?.message ?? "Failed to update project");
                }
                await updateContext({
                    flowData: {
                        ...state?.context.flowData,
                        project: { id: existingProject.id, name: name.trim(), description, databaseIds },
                    },
                });
            } else {
                const result = await createProjectAction({
                    data: { name: name.trim(), databases: databaseIds },
                    organizationId: orgId,
                });
                const createData = result?.data;
                if (!createData?.success) {
                    throw new Error(createData?.actionError?.message ?? "Failed to create project");
                }
                const project = createData.value;
                if (!project) throw new Error("Failed to create project");
                await updateContext({
                    flowData: {
                        ...state?.context.flowData,
                        project: { id: project.id, name: project.name, description, databaseIds },
                    },
                });
            }
            await next();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">
                    {isUpdateMode ? "Update project" : "Create a project"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — group databases under a project.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My project"
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            {databases.length > 0 && (
                <div className="flex flex-col gap-2">
                    <Label>Databases</Label>
                    <div className="flex flex-col gap-2">
                        {databases.map((db) => {
                            const isSelected = databaseIds.includes(db.id);
                            return (
                                <button
                                    key={db.id}
                                    type="button"
                                    onClick={() => toggleDb(db.id)}
                                    className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors text-left ${
                                        isSelected
                                            ? "border-primary/20 bg-primary/10 text-primary"
                                            : "border-border hover:bg-accent/50 hover:border-primary/20"
                                    }`}
                                >
                                    <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                        <Database className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1">
                                        <span className="font-medium">{db.name}</span>
                                        <span className="text-xs text-muted-foreground">{db.engine}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                                            <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!name.trim() || mutation.isPending}
            >
                {mutation.isPending ? "Saving…" : "Continue"}
            </Button>
        </div>
    );
};
