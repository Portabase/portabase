import { redirect } from "next/navigation";
import { getCurrentOrganizationSlug } from "@/features/organizations/organization-cookie";
import { currentUser } from "@/lib/auth/current-user";
import { isOnboardingDone } from "@/features/onboarding/is-onboarding-done";

export default async function Index() {
    if (!(await isOnboardingDone())) {
        redirect("/welcome");
    }

    const user = await currentUser();
    if (user) {
        const currentOrganizationSlug = await getCurrentOrganizationSlug();
        redirect(`/dashboard/home`);
    }
    redirect("/login");
}
