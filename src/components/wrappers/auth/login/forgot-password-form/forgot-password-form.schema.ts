"use client";

import { z } from "zod";
import { zEmail } from "@/lib/zod";

export const ForgotPasswordSchema = z.object({
    email: zEmail(),
});

export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
