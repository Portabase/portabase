import { redirect } from "next/navigation";
import { getCurrentOrganizationSlug } from "@/features/organizations/utils/organization-cookie";
import { currentUser } from "@/lib/auth/current-user";
import { isOnboardingDone } from "@/db/services/setting";
import { env } from "@/env.mjs";

export default async function Index() {
    if (env.SKIP_ONBOARDING !== "true" && !(await isOnboardingDone())) {
        redirect("/welcome");
    }

    const user = await currentUser();
    if (user) {
        const currentOrganizationSlug = await getCurrentOrganizationSlug();
        redirect(`/dashboard/home`);
    }
    redirect("/login");
}
