"use server";

import {action} from "@/lib/safe-actions/actions";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {withAuditEvent} from "@/lib/audit/with-audit-event";
import type {ServerActionResult} from "@/types/action-type";


export const logoutAction = action.action(async (): Promise<ServerActionResult<null>> => {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({headers: requestHeaders});

    return await withAuditEvent(
        async (): Promise<ServerActionResult<null>> => {
            try {
                await auth.api.signOut({
                    headers: requestHeaders,
                });

                return {
                    success: true,
                    actionSuccess: {
                        message: "logout_success",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "logout_failed",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "auth.logout",
            actor: {
                type: "user",
                id: session?.user.id ?? null,
                name: session?.user.email ?? null,
            },
        },
    );
});
