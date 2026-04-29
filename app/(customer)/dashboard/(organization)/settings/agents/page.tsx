import { redirect } from "next/navigation";

export default async function RoutePage() {
    redirect("/dashboard/settings?tab=agents");
}
