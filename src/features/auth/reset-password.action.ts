"use server";
import {ServerActionResult} from "@/types/action-type";
import {auth} from "@/lib/auth/auth";
import {zPassword, zString} from "@/lib/zod";
import z from "zod";
import {action} from "@/lib/safe-actions/actions";
import {withAuditEvent} from "@/lib/audit/with-audit-event";
import {headers} from "next/headers";


export const resetPasswordAction = action
    .schema(
        z.object({
            password: zPassword(),
            token: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<null>> => {
        let auditUserId: string | null = null;
        let auditUserEmail: string | null = null;

        try {
            const verification = await (await auth.$context).internalAdapter.findVerificationValue(`reset-password:${parsedInput.token}`);

            if (verification && verification.expiresAt >= new Date()) {
                const user = await (await auth.$context).internalAdapter.findUserById(verification.value);
                auditUserId = user?.id ?? null;
                auditUserEmail = user?.email ?? null;
            }
        } catch {
        }

        return await withAuditEvent(
            async (): Promise<ServerActionResult<null>> => {
                try {
                    const verification = await (await auth.$context).internalAdapter.findVerificationValue(`reset-password:${parsedInput.token}`);
                    if (!verification || verification.expiresAt < new Date()) {
                        return {
                            success: false,
                            actionError: {
                                message: "password_reset",
                                cause: "invalid_or_expired_token",
                            },
                        };
                    }

                    const user = await (await auth.$context).internalAdapter.findUserById(verification.value);
                    if (!user) {
                        return {
                            success: false,
                            actionError: {
                                message: "password_reset",
                                cause: "user_not_found",
                            },
                        };
                    }

                    await auth.api.resetPassword({
                        headers: await headers(),
                        body: {
                            newPassword: parsedInput.password,
                            token: parsedInput.token,
                        },
                    });

                    await (await auth.$context).internalAdapter.updateUser(user.id, {isDefaultPassword: false,});

                    return {
                        success: true,
                        actionSuccess: {
                            message: "password_reset",
                        },
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
                eventType: "auth.password_reset_complete",
                actor: {
                    type: "user",
                    id: auditUserId,
                    name: auditUserEmail,
                },
            },
        );
    });
