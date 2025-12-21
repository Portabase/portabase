"use server";
import {userAction} from "@/lib/safe-actions/actions";
import { z } from "zod";
import { UserSchema } from "@/components/wrappers/dashboard/profile2/user-form/user-form.schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import {revokeSession, unlinkAccount} from "@/lib/auth/auth";
import {withUpdatedAt} from "@/db/utils";

export const updateUserAction = userAction
    .schema(
        z.object({
            id: z.string(),
            data: UserSchema,
        })
    )
    .action(async ({ parsedInput }) => {
        const [updatedUser] = await db.update(drizzleDb.schemas.user).set(withUpdatedAt(parsedInput.data)).where(eq(drizzleDb.schemas.user.id, parsedInput.id)).returning();
        return {
            data: updatedUser,
        };
    });


export const deleteUserSessionAction = userAction.schema(z.string()).action(async ({ parsedInput }) => {
    const status = await revokeSession(parsedInput);
    return status;
});


export const unlinkUserProviderAction = userAction
    .schema(
        z.object({
            provider: z.string(),
            account: z.string(),
        })
    )
    .action(async ({ parsedInput }) => {
        const status = await unlinkAccount(parsedInput.provider, parsedInput.account);

        return status;
    });
