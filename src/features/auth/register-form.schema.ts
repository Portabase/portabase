import { z } from "zod";

// Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
const passwordValidation = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/);

export const RegisterSchema = z
    .object({
        name: z.string(),
        email: z.string(),
        password: z.string().min(8, { message: "Must have at least 8 character" }).regex(passwordValidation, {
            message: "Your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
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
