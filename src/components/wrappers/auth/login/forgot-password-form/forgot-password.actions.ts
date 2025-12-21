"use server";
import { ServerActionResult } from "@/types/action-type";
import { auth } from "@/lib/auth/auth";
import { zString } from "@/lib/zod";
import z from "zod";
import { db } from "@/db";
import {action} from "@/lib/safe-actions/actions";

//todo: to be continued...
export const forgotPasswordAction = action
    .schema(
        z.object({
            schema: z.object({
                email: zString(),
            }),
            redirectTo: zString().optional(),
        })
    )
    .action(async ({ parsedInput }): Promise<ServerActionResult<null>> => {
        try {
            const user = await (await auth.$context).internalAdapter.findUserByEmail(parsedInput.schema.email);

            if (!user) {
                return {
                    success: false,
                    actionError: {
                        message: "password_reset",
                        cause: "user_not_found",
                    },
                };
            }

            const existingToken = await db.query.verification.findFirst({
                where: (verifications, { eq, and, gte }) =>
                    and(eq(verifications.value, user.user.id), gte(verifications.expiresAt, new Date(Date.now() + 15 * 60 * 1000))),
            });

            if (existingToken) {
                return {
                    success: false,
                    actionError: {
                        message: "password_reset",
                        cause: "reset_already_requested",
                    },
                };
            }

            // await (
            //     await auth.$context
            // ).options.emailAndPassword
            //     .sendResetPassword(
            //         {
            //             user: user.user,
            //             url,
            //             token: verificationToken,
            //         },
            //         ctx.request
            //     )
            //     .catch((e) => {
            //         ctx.context.logger.error("Failed to send reset password email", e);
            //     });

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
    });
