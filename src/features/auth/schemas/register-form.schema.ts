import { z } from "zod";
import { PASSPHRASE_MIN_LENGTH, validatePassword } from "@/utils/password";

export const RegisterSchema = z
    .object({
        name: z.string(),
        email: z.string(),
        password: z.string().min(8, { message: "Must have at least 8 character" }).refine((password) => validatePassword(password).valid, {
            message: `Your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character. Or use at least ${PASSPHRASE_MIN_LENGTH} characters.`,
        }),
        confirmPassword: z.string(),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: "custom",
                message: "The passwords did not match",
                path: ["confirmPassword"],
            });
        }
    });

export type RegisterType = z.infer<typeof RegisterSchema>;
