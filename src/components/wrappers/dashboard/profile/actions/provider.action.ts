"use server";

import { ServerActionResult } from "@/types/action-type";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import z from "zod";
import { zPassword } from "@/lib/zod";
import {userAction} from "@/lib/safe-actions/actions";

export const linkPasswordProfileProviderAction = userAction
    .schema(
        z.object({
            password: zPassword(),
        })
    )
    .action(async ({ parsedInput }): Promise<ServerActionResult<null>> => {
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

            await auth.api.setPassword({
                headers: await headers(),
                body: {
                    newPassword: parsedInput.password,
                },
            });
            return {
                success: true,
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
