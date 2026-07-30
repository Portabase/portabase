"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { zPassword } from "@/lib/zod";
import { withAuditEvent } from "@/lib/audit/with-audit-event";
import type { ServerActionResult } from "@/types/action-type";

type VerifyTOTPResult = Awaited<ReturnType<typeof auth.api.verifyTOTP>>;
type DisableTwoFactorResult = Awaited<ReturnType<typeof auth.api.disableTwoFactor>>;

const PrepareTwoFactorSchema = z.object({
    password: zPassword(),
});

const EnableTwoFactorSchema = z.object({
    code: z.string().length(6),
    trustDevice: z.boolean().optional(),
});

const DisableTwoFactorSchema = z.object({
    password: zPassword(),
});

function getAuditFailureCause(value: unknown) {
    if (value instanceof Error) {
        return value.message;
    }

    if (typeof value !== "object" || value === null || !("actionError" in value)) {
        return undefined;
    }

    const actionError = value.actionError;

    if (
        typeof actionError === "object" &&
        actionError !== null &&
        "cause" in actionError &&
        typeof actionError.cause === "string"
    ) {
        return actionError.cause;
    }

    return undefined;
}

export const prepareTwoFactorEnableAction = userAction
    .schema(PrepareTwoFactorSchema)
    .action(async ({ parsedInput }): Promise<ServerActionResult<{ totpURI: string; backupCodes?: string[] }>> => {
        try {
            const response = await auth.api.enableTwoFactor({
                headers: await headers(),
                body: {
                    password: parsedInput.password,
                },
            });

            return {
                success: true,
                value: response,
                actionSuccess: {
                    message: "two_factor_enable_prepared",
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "two_factor_enable_prepare_failed",
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });

export const enableTwoFactorAction = userAction
    .schema(EnableTwoFactorSchema)
    .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<VerifyTOTPResult>> => {
        return await withAuditEvent(
            async (): Promise<ServerActionResult<VerifyTOTPResult>> => {
                try {
                    const response = await auth.api.verifyTOTP({
                        headers: await headers(),
                        body: {
                            code: parsedInput.code,
                            trustDevice: parsedInput.trustDevice,
                        },
                    });

                    return {
                        success: true,
                        value: response,
                        actionSuccess: {
                            message: "two_factor_enabled",
                        },
                    };
                } catch (error) {
                    return {
                        success: false,
                        actionError: {
                            message: "two_factor_enable_failed",
                            cause: error instanceof Error ? error.message : "Unknown error",
                        },
                    };
                }
            },
            {
                eventType: "auth.two_factor_enable",
                actor: {
                    type: "user",
                    id: ctx.user.id,
                    name: ctx.user.email,
                },
                organization: null,
                target: null,
                metadata: {},
                onFailure: (value) => {
                    const cause = getAuditFailureCause(value);

                    if (!cause) {
                        return undefined;
                    }

                    return {
                        metadata: {
                            cause,
                        },
                    };
                },
            },
        );
    });

export const disableTwoFactorAction = userAction
    .schema(DisableTwoFactorSchema)
    .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<DisableTwoFactorResult>> => {
        return await withAuditEvent(
            async (): Promise<ServerActionResult<DisableTwoFactorResult>> => {
                try {
                    const response = await auth.api.disableTwoFactor({
                        headers: await headers(),
                        body: {
                            password: parsedInput.password,
                        },
                    });

                    return {
                        success: true,
                        value: response,
                        actionSuccess: {
                            message: "two_factor_disabled",
                        },
                    };
                } catch (error) {
                    return {
                        success: false,
                        actionError: {
                            message: "two_factor_disable_failed",
                            cause: error instanceof Error ? error.message : "Unknown error",
                        },
                    };
                }
            },
            {
                eventType: "auth.two_factor_disable",
                actor: {
                    type: "user",
                    id: ctx.user.id,
                    name: ctx.user.email,
                },
                organization: null,
                target: null,
                metadata: {},
                onFailure: (value) => {
                    const cause = getAuditFailureCause(value);

                    if (!cause) {
                        return undefined;
                    }

                    return {
                        metadata: {
                            cause,
                        },
                    };
                },
            },
        );
    });
