"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { refreshDashboardViews } from "@/features/stats/queries/views.queries";
import { revalidatePath } from "next/cache";

export const refreshDashboardAction = userAction.action(async () => {
  await refreshDashboardViews();
  revalidatePath("/dashboard/home");
});
