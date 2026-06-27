"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";

export const updateAccountAction = userAction
  .schema(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const name = `${parsedInput.firstName} ${parsedInput.lastName}`.trim();
    const [updated] = await db
      .update(drizzleDb.schemas.user)
      .set({ name, updatedAt: new Date() })
      .where(eq(drizzleDb.schemas.user.id, ctx.user.id))
      .returning();
    return { user: updated };
  });
