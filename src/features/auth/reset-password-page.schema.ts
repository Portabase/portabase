import {z} from "zod";
import {zPassword} from "@/lib/zod";

export const ResetPasswordSchema = z
    .object({
        password: zPassword(),
        confirmPassword: zPassword(),
    })
    .superRefine(({confirmPassword, password}, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: "custom",
                message: "Passwords don't match.",
                path: ["confirmPassword"],
            });
        }
    });

export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
