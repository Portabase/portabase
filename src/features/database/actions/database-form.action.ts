"use server";

import { z } from "zod";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { DatabaseSchema } from "@/features/database/schemas/database-form.schema";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";

export const updateDatabaseAction = userAction
    .inputSchema(
        z.object({
            id: z.string(),
            data: DatabaseSchema,
        })
    )
    .action(async ({ parsedInput }) => {
        const [updated] = await db.update(drizzleDb.schemas.database).set(parsedInput.data).where(eq(drizzleDb.schemas.database.id, parsedInput.id)).returning().execute();

        return updated;
    });
