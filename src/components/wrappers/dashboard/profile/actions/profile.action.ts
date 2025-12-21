"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { user } from "@/db/schema/02_user";
import {userAction} from "@/lib/safe-actions/actions";

const UpdateProfileSchema = z.object({
    name: z.string().optional(),
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
                ...(parsedInput.name ? { name: parsedInput.name } : {}),
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
