"use server";

import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { headers } from "next/headers";
import { auth, getPasskeys, revokePasskey } from "@/lib/auth/auth";
import { userAction } from "@/lib/safe-actions/actions";

const RevokeSessionSchema = z.object({
    token: z.string(),
});

const RevokePasskeySchema = z.object({
    id: z.string(),
});


export const revokeSessionAction = userAction.schema(RevokeSessionSchema).action(async ({ parsedInput }): Promise<ServerActionResult<{}>> => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                actionError: {
                    message: "unauthorized",
                    cause: "User not authenticated",
                },
            };
        }

        await auth.api.revokeSession({
            body: {
                token: parsedInput.token,
            },
            headers: await headers(),
        });

        return {
            success: true,
            value: {},
            actionSuccess: {
                message: "session_revoked",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "error_revoking_session",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});

export const revokeAllSessionsAction = userAction.action(async (): Promise<ServerActionResult<{}>> => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return {
                success: false,
                actionError: {
                    message: "unauthorized",
                    cause: "User not authenticated",
                },
            };
        }

        const sessions = await auth.api.listSessions({
            headers: await headers(),
        });

        const otherSessions = sessions.filter((s) => s.token !== session.session.token);

        for (const s of otherSessions) {
            await auth.api.revokeSession({
                body: {
                    token: s.token,
                },
                headers: await headers(),
            });
        }

        return {
            success: true,
            value: {},
            actionSuccess: {
                message: "other_sessions_revoked",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "error_revoking_other_sessions",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});


export const getPasskeysAction = userAction.action(async (): Promise<ServerActionResult<any[]>> => {
    try {
        const passkeys = await getPasskeys();
        return {
            success: true,
            value: passkeys || [],
            actionSuccess: {
                message: "passkeys_fetched",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "error_fetching_passkeys",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});

export const revokePasskeyAction = userAction.schema(RevokePasskeySchema).action(async ({ parsedInput }): Promise<ServerActionResult<{}>> => {
    try {
        await revokePasskey(parsedInput.id);
        return {
            success: true,
            value: {},
            actionSuccess: {
                message: "passkey_revoked",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "error_revoking_passkey",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});