"use server";

import {userAction} from "@/lib/safe-actions/actions";
import {ToggleHealthDashboardSchema} from "./health.schema";
import {ServerActionResult} from "@/types/action-type";
import {toggleHealthDashboardPreference} from "@/db/services/health-dashboard-preference";
import {HealthDashboardPreference} from "@/db/schema/15_health-dashboard-preference";

export const toggleHealthDashboardAction = userAction
    .schema(ToggleHealthDashboardSchema)
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<HealthDashboardPreference>> => {
        try {
            const preference = await toggleHealthDashboardPreference(
                ctx.user.id,
                parsedInput.databaseId,
                parsedInput.visible
            );

            return {
                success: true,
                value: preference,
                actionSuccess: {
                    message: parsedInput.visible
                        ? "Health chart pinned to dashboard"
                        : "Health chart removed from dashboard",
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to update dashboard preference.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });
