"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import {
  createProjectAction,
  updateProjectAction,
} from "@/features/projects/actions/projects.action";
import type { OnboardingProjectData } from "@/features/onboarding/types";

type ProjectInput = { name: string; databaseIds: string[] };

export const useCreateProject = () => {
  const { state, updateContext } = useOnboarding();

  return useMutation({
    mutationFn: async ({ name, databaseIds }: ProjectInput) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Project name is required");
      const orgId = (state?.context.flowData.org as any)?.id as string | undefined;
      if (!orgId) throw new Error("No organisation ID found");
      const existingProject = state?.context.flowData.project as OnboardingProjectData | undefined;

      if (existingProject?.id) {
        const result = await updateProjectAction({
          data: { name: trimmed, databases: databaseIds },
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
            project: { id: existingProject.id, name: trimmed, databaseIds },
          },
        });
      } else {
        const result = await createProjectAction({
          data: { name: trimmed, databases: databaseIds },
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
            project: { id: project.id, name: project.name, databaseIds },
          },
        });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
