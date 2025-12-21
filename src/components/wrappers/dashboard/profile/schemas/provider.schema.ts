"use client";

import { zPassword } from "@/lib/zod";
import z from "zod";

export const PasswordProviderSchema = z.object({
    password: zPassword(),
    confirmPassword: zPassword(),
});

export type PasswordProviderSchemaType = z.infer<typeof PasswordProviderSchema>;
