import { z } from "zod";
import { zEmail, zString } from "@/lib/zod";

export const UserSchema = z.object({
    email: zEmail(),
    name: zString(),
});

export type UserType = z.infer<typeof UserSchema>;

export const UserEditSchema = z.object({
    email: zEmail(),
    name: zString(),
});

export type UserEditType = z.infer<typeof UserEditSchema>;
