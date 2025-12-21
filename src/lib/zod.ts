import { z } from "zod";

export const zString = () =>
    z.string();

export const zEnum = <T extends [string, ...string[]]>(values: T) => z.enum(values, { message: "Field required" });

export const zEmail = () => z.string().email({ message: "Invalid email" });

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])/;

export const zPassword = () => zString().min(8, { message: "New Password too short" }).regex(passwordRegex, { message: "New password too weak" });

export const zDate = () =>
    z.preprocess(
        (arg) => {
            if (typeof arg === "string" || arg instanceof Date) {
                const date = new Date(arg);
                return isNaN(date.getTime()) ? undefined : date;
            }
            return undefined;
        },
        z.date()
    );
