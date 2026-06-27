"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { applyOnboardingDbSettingsAction } from "@/features/onboarding/actions/apply-db-settings.action";

export const useApplyDbSettings = () =>
  useMutation({
    mutationFn: (args: Parameters<typeof applyOnboardingDbSettingsAction>[0]) =>
      applyOnboardingDbSettingsAction(args),
    onError: () => toast.error("Failed to save settings."),
  });
