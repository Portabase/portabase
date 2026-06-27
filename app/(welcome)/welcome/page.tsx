import { redirect } from "next/navigation";
import { resolveOnboardingState } from "@/features/onboarding/onboarding-state";
import { OnboardingClient } from "./onboarding-client";

export default async function WelcomePage() {
    const result = await resolveOnboardingState();

    if ("redirect" in result) {
        redirect(result.redirect);
    }

    return (
        <OnboardingClient
            key={result.stepId}
            initialStepId={result.stepId}
            initialFlowData={result.flowData}
        />
    );
}
