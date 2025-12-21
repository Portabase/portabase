"use server";
import { db } from "@/db";
import {userAction} from "@/lib/safe-actions/actions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as drizzleDb from "@/db";


export const updateImageUserAction = userAction.schema(z.string()).action(async ({ parsedInput, ctx }) => {
    const [updatedUser] = await db.update(drizzleDb.schemas.user).set({ image: parsedInput }).where(eq(drizzleDb.schemas.user.id, ctx.user.id)).returning();

    return {
        data: updatedUser,
    };
});
