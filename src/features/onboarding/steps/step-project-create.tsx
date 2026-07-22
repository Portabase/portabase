"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Check, Database, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateProject } from "@/features/onboarding/hooks/use-create-project";
import type {
  OnboardingDatabase,
  OnboardingProjectData,
} from "@/features/onboarding/types";

export const StepProjectCreate = () => {
  const { state, next } = useOnboarding();
  const existingProject = state?.context.flowData.project as
    | OnboardingProjectData
    | undefined;
  const databases = (state?.context.flowData.databases ??
    []) as OnboardingDatabase[];
  const isUpdateMode = !!existingProject;

  const [name, setName] = useState(existingProject?.name ?? "");
  const [databaseIds, setDatabaseIds] = useState<string[]>(
    existingProject?.databaseIds ?? [],
  );
  const [loadingDbId, setLoadingDbId] = useState<string | null>(null);

  const mutation = useCreateProject();

  const toggleDb = (id: string) => {
    setLoadingDbId(id);
    const newDbIds = databaseIds.includes(id)
      ? databaseIds.filter((v) => v !== id)
      : [...databaseIds, id];
    setDatabaseIds(newDbIds);
    mutation.mutate(
      { name: name || "My project", databaseIds: newDbIds },
      { onSettled: () => setLoadingDbId(null) },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isUpdateMode ? "Update project" : "Create a project"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — group databases under a project.
        </p>
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
      {databases.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Select databases</Label>
          <div className="flex flex-col gap-2 max-h-52 sm:max-h-64 md:max-h-80 overflow-y-auto scrollbar-hide">
            {databases.map((db) => {
              const isSelected = databaseIds.includes(db.id);
              const isCurrentLoading = loadingDbId === db.id;

              return (
                <button
                  key={db.id}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => toggleDb(db.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-all text-left ${
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
                    <span className="text-xs text-muted-foreground">
                      {db.engine}
                    </span>
                  </div>
                  {isCurrentLoading ? (
                    <div className="size-5 rounded-full flex items-center justify-center ml-auto">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : isSelected ? (
                    <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto">
                      <Check
                        className="size-3 text-primary-foreground"
                        strokeWidth={3}
                      />
                    </div>
                  ) : (
                    <div className="size-5 rounded-full border-2 border-muted-foreground/30 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Button
        type="button"
        onClick={() =>
          mutation.mutate(
            { name: name || "My project", databaseIds },
            { onSuccess: () => next() },
          )
        }
        disabled={!name.trim() && !existingProject}
      >
        {mutation.isPending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
};
