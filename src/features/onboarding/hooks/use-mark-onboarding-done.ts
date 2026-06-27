"use client";

import { useMutation } from "@tanstack/react-query";
import { markOnboardingDoneAction } from "@/features/onboarding/actions/onboarding-mark-done.action";

export const useMarkOnboardingDone = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await markOnboardingDoneAction({});
      if (!result?.data) throw new Error("Failed to mark onboarding done");
      return result.data;
    },
  });
};
