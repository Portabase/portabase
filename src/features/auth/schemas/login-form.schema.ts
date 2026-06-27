"use client";

import { z } from "zod";
import { zEmail, zString } from "@/lib/zod";

export const LoginSchema = z.object({
    email: zEmail(),
    password: zString().nonempty(),
});

export type LoginType = z.infer<typeof LoginSchema>;
