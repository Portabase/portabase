"use server";

import {ServerActionResult} from "@/types/action-type";
import {auth} from "@/lib/auth/auth";
import {zString} from "@/lib/zod";
import z from "zod";
import {action} from "@/lib/safe-actions/actions";
import {withAuditEvent} from "@/lib/audit/with-audit-event";
import {headers} from "next/headers";


export const forgotPasswordAction = action
    .schema(z.object({
            email: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<null>> => {
        let userId = null;

        try {
            const matchedUser = await (await auth.$context).internalAdapter.findUserByEmail(parsedInput.email);
            userId = matchedUser?.user.id ?? null;
        } catch {
        }

        return await withAuditEvent(
            async (): Promise<ServerActionResult<null>> => {
                try {
                    await auth.api.requestPasswordReset({
                        headers: await headers(),
                        body: {
                            email: parsedInput.email,
                        },
                    });

                    return {
                        success: true,
                    };
                } catch (error) {
                    return {
                        success: false,
                        actionError: {
                            message: "password_reset",
                            cause: error instanceof Error ? error.message : "Unknown error",
                        },
                    };
                }
            },
            {
                eventType: "auth.password_reset_request",
                actor: {
                    type: "user",
                    id: userId,
                    name: parsedInput.email,
                },
            },
        );
    });
