"use client";

import { useRouter } from "next/navigation";
import { OnboardingProvider } from "@onboardjs/react";
import { onboardingSteps } from "@/features/onboarding/onboarding-steps";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import type { OnboardingFlowData } from "@/features/onboarding/types";

type Props = {
    initialStepId: string;
    initialFlowData: Partial<OnboardingFlowData>;
};

export const OnboardingClient = ({ initialStepId, initialFlowData }: Props) => {
    const router = useRouter();

    return (
        <OnboardingProvider
            steps={onboardingSteps}
            initialStepId={initialStepId}
            initialContext={{ flowData: initialFlowData }}
            onFlowComplete={async () => {
                router.push("/dashboard/home");
            }}
        >
            <OnboardingShell />
        </OnboardingProvider>
    );
};
