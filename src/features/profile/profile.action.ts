"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { createApiKey, deleteApiKey, getApiKeys } from "@/lib/auth/auth";
import { user } from "@/db/schema/02_user";
import {userAction} from "@/lib/safe-actions/actions";
import {ApiKey} from "@better-auth/api-key";
import { withAuditEvent } from "@/lib/audit/with-audit-event";

const UpdateProfileSchema = z.object({
    name: z.string().trim().nonempty().optional(),
});

export const updateProfileSettingsAction = userAction.schema(UpdateProfileSchema).action(async ({ parsedInput, ctx }): Promise<ServerActionResult<{}>> => {
    return await withAuditEvent(
        async (): Promise<ServerActionResult<{}>> => {
            try {
                await db
                    .update(user)
                    .set({
                        ...(parsedInput.name ? { name: parsedInput.name } : {}),
                    })
                    .where(eq(user.id, ctx.user.id));

                return {
                    success: true,
                    value: {},
                    actionSuccess: {
                        message: "profile_updated",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "error_updating_profile",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "user.update",
            actor: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            organization: null,
            target: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            metadata: {},
        },
    );
});


export const getApiKeysAction = userAction.action(async (): Promise<ServerActionResult<any[]>> => {
    try {
        const apikeys = await getApiKeys();
        return {
            success: true,
            value: apikeys.apiKeys || [],
            actionSuccess: {
                message: "apikeys_fetched",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "error_fetching_apikeys",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});

const CreateApiKeySchema = z.object({
    name: z.string(),
});


export const createApiKeysAction = userAction.schema(CreateApiKeySchema).action(async ({parsedInput, ctx} ): Promise<ServerActionResult<ApiKey>> => {
    return await withAuditEvent(
        async (): Promise<ServerActionResult<ApiKey>> => {
            try {
                const apikey = await createApiKey(parsedInput.name);
                return {
                    success: true,
                    value: apikey,
                    actionSuccess: {
                        message: "apikey_created",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "error_creating_apikeys",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "api_key.create",
            actor: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            organization: null,
            target: {
                type: "api_key" as const,
                id: null,
                name: parsedInput.name,
            },
            metadata: {},
            onSuccess: (result) => {
                if (!result.success) {
                    return undefined;
                }

                return {
                    target: {
                        type: "api_key" as const,
                        id: result.value?.id ?? null,
                        name: result.value?.name ?? parsedInput.name,
                    },
                };
            },
        },
    );
});

const DeleteApiKeySchema = z.object({
    id: z.string(),
});

export const deleteApiKeyAction = userAction.schema(DeleteApiKeySchema).action(async ({ parsedInput, ctx }): Promise<ServerActionResult<{}>> => {
    let apiKeyName: string | null = null;

    try {
        const apiKeys = await getApiKeys();
        apiKeyName = apiKeys.apiKeys?.find((candidate) => candidate.id === parsedInput.id)?.name ?? null;
    } catch {
        apiKeyName = null;
    }

    return await withAuditEvent(
        async (): Promise<ServerActionResult<{}>> => {
            try {
                await deleteApiKey(parsedInput.id);
                return {
                    success: true,
                    value: {},
                    actionSuccess: {
                        message: "apikey_revoked",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "error_deleting_apikey",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "api_key.delete",
            actor: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            organization: null,
            target: {
                type: "api_key" as const,
                id: parsedInput.id,
                name: apiKeyName,
            },
            metadata: {},
        },
    );
});
