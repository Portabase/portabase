import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { isOnboardingDone } from "@/features/onboarding/onboarding-cookie";
import { OnboardingClient } from "./onboarding-client";

export default async function WelcomePage() {
    if (await isOnboardingDone()) {
        redirect("/dashboard/home");
    }

    const user = await currentUser();
    const initialStepId = user ? "org-create" : "sso-gate";

    return <OnboardingClient initialStepId={initialStepId} />;
}
