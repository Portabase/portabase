"use client";

import { useRouter } from "next/navigation";
import { OnboardingProvider } from "@onboardjs/react";
import { onboardingSteps } from "@/features/onboarding/onboarding-steps";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { markOnboardingDone } from "@/features/onboarding/onboarding-cookie";

export const OnboardingClient = ({ initialStepId }: { initialStepId: string }) => {
    const router = useRouter();

    return (
        <OnboardingProvider
            steps={onboardingSteps}
            initialStepId={initialStepId}
            onFlowComplete={async () => {
                await markOnboardingDone();
                router.push("/dashboard/home");
            }}
        >
            <OnboardingShell />
        </OnboardingProvider>
    );
};
