"use server";

import { z } from "zod";
import { action } from "@/lib/safe-actions/actions";
import { signPasskeyContext } from "@/lib/auth/passkey-context";

export const generatePasskeyContextAction = action
  .schema(z.object({ name: z.string().min(1), email: z.email() }))
  .action(async ({ parsedInput }) => {
    return signPasskeyContext(parsedInput.name, parsedInput.email);
  });
