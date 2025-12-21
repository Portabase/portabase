"use server";
import {userAction} from "@/lib/safe-actions/actions";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import {authClient} from "@/lib/auth/auth-client";
import {auth} from "@/lib/auth/auth";


export const deleteUserAction = userAction.schema(z.string()).action(async ({ parsedInput, ctx }) => {
    const userId = parsedInput.length > 0 ? parsedInput : ctx.user.id;
    const uuid = uuidv4();


    // const [updatedUser] = await db
    //     .update(drizzleDb.schemas.user)
    //     .set({
    //         email: `${uuid}@portabase.com`,
    //         name: `${uuid}`,
    //         //deleted: true,
    //         //todo: add deleted
    //     })
    //     .where(eq(drizzleDb.schemas.user.id, userId))
    //     .returning();
    const [deletedUser] = await db
        .delete(drizzleDb.schemas.user)
        .where(eq(drizzleDb.schemas.user.id, userId))
        .returning();


    return {
        data: deletedUser,
    };
});
