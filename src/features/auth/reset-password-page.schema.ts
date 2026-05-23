import {z} from "zod";

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])/;

const zPassword = () => z.string().min(8, {message: "New Password too short"}).regex(passwordRegex, {message: "New Password too weak"});

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
