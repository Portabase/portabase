"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { headers } from "next/headers";
import {auth, createApiKey, deleteApiKey, getApiKeys, getPasskeys, revokePasskey} from "@/lib/auth/auth";
import { user } from "@/db/schema/02_user";
import {userAction} from "@/lib/safe-actions/actions";
import {ApiKey} from "@better-auth/api-key";

const UpdateProfileSchema = z.object({
    name: z.string().trim().nonempty().optional(),
});

export const updateProfileSettingsAction = userAction.schema(UpdateProfileSchema).action(async ({ parsedInput }): Promise<ServerActionResult<{}>> => {
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

        await db
            .update(user)
            .set({
                ...(parsedInput.name ? { name: parsedInput.name.trim() } : {}),
            })
            .where(eq(user.id, session.user.id));

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


export const createApiKeysAction = userAction.schema(CreateApiKeySchema).action(async ({parsedInput} ): Promise<ServerActionResult<ApiKey>> => {
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
});

const DeleteApiKeySchema = z.object({
    id: z.string(),
});

export const deleteApiKeyAction = userAction.schema(DeleteApiKeySchema).action(async ({ parsedInput }): Promise<ServerActionResult<{}>> => {
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
});