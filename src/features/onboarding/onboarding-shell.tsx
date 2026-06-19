"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "@/features/onboarding/onboarding-stepper";
import { OnboardingChecklist } from "@/features/onboarding/onboarding-checklist";
import { Heart } from "lucide-react";
import { AuthLogoSection } from "../auth/auth-logo-section";
import { STEP_ORDER } from "@/features/onboarding/constants/steps";

export const OnboardingShell = () => {
  const { state, previous, skip, next, renderStep } = useOnboarding();

  const currentStepId = String(state?.currentStep?.id ?? "");
  const currentIndex = STEP_ORDER.indexOf(currentStepId);

  const [latestIndex, setLatestIndex] = useState(currentIndex);

  useEffect(() => {
    setLatestIndex((prev) => Math.max(prev, currentIndex));
  }, [currentIndex]);

  if (!state) return null;

  const showSplit =
    currentStepId !== "agent-waiting" && currentStepId !== "finish";

  const isGoingBack = currentIndex < latestIndex;

  // Steps that are one-way: disable Back both when ON them and when they'd be the destination
  const BLOCKED_STEPS = ["login", "account-info", "security"];
  const prevStepId = STEP_ORDER[currentIndex - 1] ?? "";
  const canGoBack =
    !BLOCKED_STEPS.includes(currentStepId) &&
    !BLOCKED_STEPS.includes(prevStepId) &&
    currentIndex > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-4">
      <AuthLogoSection />
      <div className="w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        <div className="flex-1 flex flex-col gap-6 p-8">
          <OnboardingStepper />
          <div className="flex-1">{renderStep()}</div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => previous()}
              disabled={!canGoBack || state.isLoading}
            >
              Back
            </Button>
            <div className="flex gap-2">
              {state.isSkippable && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => skip()}
                  disabled={state.isLoading}
                >
                  Skip
                </Button>
              )}
              {isGoingBack && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => next()}
                  disabled={state.isLoading}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
        {showSplit && (
          <div className="hidden md:block w-75 border-l border-border bg-muted/30">
            <OnboardingChecklist />
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground flex flex-col gap-1">
        <p className="flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="size-3 fill-red-500 text-red-500 animate-pulse" />{" "}
          by <span className="font-medium text-foreground">Portabase</span>
        </p>
      </footer>
    </div>
  );
};
