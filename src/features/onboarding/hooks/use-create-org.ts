"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import {
  createOrganizationAction,
  updateOrganizationAction,
} from "@/features/organizations/actions/organization.action";
import { slugify } from "@/utils/slugify";

export const useCreateOrg = () => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Organisation name is required");

      const existingOrg = state?.context.flowData.org as
        | { id: string; name: string }
        | undefined;

      if (existingOrg) {
        const result = await updateOrganizationAction({
          organizationId: existingOrg.id,
          data: { name: trimmed, slug: slugify(trimmed), users: [] },
        });
        const updateData = result?.data;
        if (!updateData?.success) {
          throw new Error(
            updateData?.actionError?.message ?? "Failed to update organisation",
          );
        }
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            org: { id: existingOrg.id, name: trimmed },
          },
        });
      } else {
        const result = await createOrganizationAction({ name: trimmed });
        const createData = result?.data;
        if (!createData?.success) {
          throw new Error(
            createData?.actionError?.message ?? "Failed to create organisation",
          );
        }
        const org = createData.value;
        if (!org) throw new Error("Failed to create organisation");
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            org: { id: org.id, name: org.name },
          },
        });
      }

      await next();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
