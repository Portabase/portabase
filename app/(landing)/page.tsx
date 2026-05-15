import { redirect } from "next/navigation";
import { getCurrentOrganizationSlug } from "@/features/dashboard/organization-cookie";
import { currentUser } from "@/lib/auth/current-user";

export default async function Index() {
    const user = await currentUser();
    if (user) {
        const currentOrganizationSlug = await getCurrentOrganizationSlug();
        redirect(`/dashboard/home`);
    }
    redirect("/login");
}
