"use client";

import z from "zod";
import {zPassword} from "@/lib/zod";

export const ResetPasswordSecuritySchema = z
    .object({
        currentPassword: zPassword(),
        newPassword: zPassword(),
        confirmPassword: zPassword(),
    })
    .superRefine(({ confirmPassword, newPassword }, ctx) => {
        if (confirmPassword !== newPassword) {
            ctx.addIssue({
                code: "custom",
                message: "New password does not match",
                path: ["confirmPassword"],
            });
        }
    });

export type ResetPasswordSecuritySchemaType = z.infer<typeof ResetPasswordSecuritySchema>;

export const Setup2FASecuritySchema = z.object({
    code: z.string().min(6, "Code need to contain at least 6 characters"),
});

export type Setup2FASecuritySchemaType = z.infer<typeof Setup2FASecuritySchema>;
