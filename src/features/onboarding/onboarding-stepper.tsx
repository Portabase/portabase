"use client";

import { useOnboarding } from "@onboardjs/react";
import { Progress } from "@/components/ui/progress";
import { STEP_ORDER } from "@/features/onboarding/constants/steps";
import { useIsMobile } from "@/hooks/use-mobile";

export const OnboardingStepper = () => {
  const { state } = useOnboarding();
  const mobile = useIsMobile();
  if (!state) return null;

  const currentId = String(state.currentStep?.id ?? "");
  const currentIndex = Math.max(0, STEP_ORDER.indexOf(currentId));
  const totalSteps = STEP_ORDER.length;
  const stepNumber = currentIndex + 1;
  const progress = Math.round((currentIndex / (totalSteps - 1)) * 100);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between text-xs text-muted-foreground">
        {mobile && (
          <span>
            Step {stepNumber} of {totalSteps}
          </span>
        )}
      </div>
      <Progress value={progress} />
    </div>
  );
};
