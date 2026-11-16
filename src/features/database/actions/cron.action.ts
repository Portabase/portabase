"use server";

import {z} from "zod";
import {db} from "@/db";
import {and, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {PolicyScopeSchema} from "@/features/database/schemas/policy-scope.schema";
import {assertCanManagePolicyScope} from "@/features/database/utils/database-acl";
import {validate} from "node-cron";

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
        // An empty policy stops the backups and drops the scope's retention.
        await assertCanManagePolicyScope(parsedInput.scope).catch(() => {
            throw new ActionError("Not authorized");
        });
        const updated = await updateBackupPolicyService(parsedInput.scope, parsedInput.backupPolicy);
        return {data: updated};
    });

export const updateFullBackupCronAction = userAction
    .inputSchema(z.object({databaseId: z.string().uuid(), cron: z.string()}))
    .action(async ({parsedInput}) => {
        // An empty value turns the schedule off: fulls then only start on chain age (full_every_days).
        await assertCanManagePolicyScope({type: "database", id: parsedInput.databaseId}).catch(() => {
            throw new ActionError("Not authorized");
        });
        const cron = parsedInput.cron.trim() || null;
        if (cron && !validate(cron)) throw new ActionError("Invalid cron expression");
        const [updated] = await db
            .update(drizzleDb.schemas.database)
            .set({fullBackupCron: cron})
            .where(eq(drizzleDb.schemas.database.id, parsedInput.databaseId))
            .returning();
        return {data: updated};
    });
