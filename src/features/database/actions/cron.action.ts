"use server";

import {z} from "zod";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";

export async function updateDatabaseBackupPolicyService(
    databaseId: string,
    backupPolicy: string
) {
    const cronPolicy = backupPolicy === "" ? null : backupPolicy;

    const [updated] = await db
        .update(drizzleDb.schemas.database)
        .set({
            backupPolicy: cronPolicy,
        })
        .where(eq(drizzleDb.schemas.database.id, databaseId))
        .returning()
        .execute();

    if (cronPolicy == null) {
        await db.delete(drizzleDb.schemas.retentionPolicy)
            .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId)).execute();
    }

    return updated;
}

export const updateDatabaseBackupPolicyAction = userAction
    .inputSchema(
        z.object({
            databaseId: z.string(),
            backupPolicy: z.string(),
        })
    )
    .action(async ({parsedInput}) => {
        const updated = await updateDatabaseBackupPolicyService(
            parsedInput.databaseId,
            parsedInput.backupPolicy
        );

        return {
            data: updated,
        };
    });
