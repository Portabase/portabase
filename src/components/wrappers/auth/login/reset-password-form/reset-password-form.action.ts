"use server";
import { ServerActionResult } from "@/types/action-type";
import { auth } from "@/lib/auth/auth";
import { zPassword, zString } from "@/lib/zod";
import z from "zod";
import {action} from "@/lib/safe-actions/actions";

export const resetPasswordAction = action
    .schema(
        z.object({
            schema: z.object({
                password: zPassword(),
            }),
            token: zString(),
        })
    )
    .action(async ({ parsedInput }): Promise<ServerActionResult<null>> => {
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
            console.log(user)
            if (!user) {
                return {
                    success: false,
                    actionError: {
                        message: "password_reset",
                        cause: "user_not_found",
                    },
                };
            }

            const hashedPassword = await (await auth.$context).password.hash(parsedInput.schema.password);
            console.log(hashedPassword)
            console.log("ok")
            // await (await auth.$context).internalAdapter.updatePassword(user.id, hashedPassword);
            console.log("ici")
            // await (await auth.$context).internalAdapter.deleteSessions(user.id);
            // console.log("ici2")
            // await (await auth.$context).internalAdapter.deleteVerificationValue(verification.id);
            // console.log("ici3");
            //
            // (await auth.$context).internalAdapter.updateUser(user.id, {
            //     lastChangedPasswordAt: new Date(),
            // });

            // await auth.api.resetPassword({
            //     headers: await headers(),
            //     body: {
            //         newPassword: parsedInput.schema.password,
            //         token: parsedInput.token,
            //     },
            // });

            await (
                await auth.$context
            ).internalAdapter.updateUser(user.id, {
                isDefaultPassword: false,
            });

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
    });
