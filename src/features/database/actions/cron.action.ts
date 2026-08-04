"use server";

import {z} from "zod";
import {db} from "@/db";
import {and, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";
import {PolicyScopeSchema} from "@/features/database/schemas/policy-scope.schema";

export async function updateBackupPolicyService(
    scope: {type: "database" | "project"; id: string},
    backupPolicy: string
) {
    const cronPolicy = backupPolicy === "" ? null : backupPolicy;

    if (scope.type === "database") {
        const [updated] = await db
            .update(drizzleDb.schemas.database)
            .set({backupPolicy: cronPolicy})
            .where(eq(drizzleDb.schemas.database.id, scope.id))
            .returning()
            .execute();
        if (cronPolicy == null) {
            await db.delete(drizzleDb.schemas.retentionPolicy)
                .where(and(
                    eq(drizzleDb.schemas.retentionPolicy.databaseId, scope.id),
                    isNull(drizzleDb.schemas.retentionPolicy.projectId),
                )).execute();
        }
        return updated;
    }

    const [updated] = await db
        .update(drizzleDb.schemas.project)
        .set({backupPolicy: cronPolicy})
        .where(eq(drizzleDb.schemas.project.id, scope.id))
        .returning()
        .execute();
    if (cronPolicy == null) {
        await db.delete(drizzleDb.schemas.retentionPolicy)
            .where(and(
                eq(drizzleDb.schemas.retentionPolicy.projectId, scope.id),
                isNull(drizzleDb.schemas.retentionPolicy.databaseId),
            )).execute();
    }
    return updated;
}

export const updateBackupPolicyAction = userAction
    .inputSchema(z.object({scope: PolicyScopeSchema, backupPolicy: z.string()}))
    .action(async ({parsedInput}) => {
        const updated = await updateBackupPolicyService(parsedInput.scope, parsedInput.backupPolicy);
        return {data: updated};
    });

export const updateDatabaseBackupPolicyAction = userAction
    .inputSchema(z.object({databaseId: z.string(), backupPolicy: z.string()}))
    .action(async ({parsedInput}) => {
        const updated = await updateBackupPolicyService(
            {type: "database", id: parsedInput.databaseId},
            parsedInput.backupPolicy,
        );
        return {data: updated};
    });
