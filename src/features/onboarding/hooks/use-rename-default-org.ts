"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { updateOrganizationAction } from "@/features/organizations/actions/organization.action";
import { DEFAULT_ORGANIZATION_SLUG } from "@/features/organizations/constants";

export const useRenameDefaultOrg = () => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Organisation name is required");

      const org = state?.context.flowData.org as
        | { id: string; name: string }
        | undefined;
      if (!org) throw new Error("Default organisation not found");

      const result = await updateOrganizationAction({
        organizationId: org.id,
        data: { name: trimmed, slug: DEFAULT_ORGANIZATION_SLUG, users: [] },
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
          org: { id: org.id, name: trimmed },
        },
      });

      await next();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
