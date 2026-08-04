"use server"

import {z} from "zod"
import {db} from "@/db"
import {and, eq, isNull} from "drizzle-orm"
import * as drizzleDb from "@/db";
import {
    RetentionSettingsSchema
} from "@/features/database/schemas/retention-policy.schema";
import {PolicyScopeSchema, scopeOwner} from "@/features/database/schemas/policy-scope.schema";
import {userAction} from "@/lib/safe-actions/actions";


export const updateOrCreateBackupRetentionPolicyAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            settings: RetentionSettingsSchema,
        })
    )
    .action(async ({parsedInput}) => {
        const {scope, settings} = parsedInput;
        const owner = scopeOwner(scope);
        const ownerCol = scope.type === "database"
            ? drizzleDb.schemas.retentionPolicy.databaseId
            : drizzleDb.schemas.retentionPolicy.projectId;
        const otherCol = scope.type === "database"
            ? drizzleDb.schemas.retentionPolicy.projectId
            : drizzleDb.schemas.retentionPolicy.databaseId;

        const existing = await db
            .select()
            .from(drizzleDb.schemas.retentionPolicy)
            .where(and(eq(ownerCol, scope.id), isNull(otherCol)))
            .limit(1);

        const values = {
            type: settings.type ?? "gfs",
            count: settings.count,
            days: settings.days,
            gfsHourly: settings.gfs.hourly,
            gfsDaily: settings.gfs.daily,
            gfsWeekly: settings.gfs.weekly,
            gfsMonthly: settings.gfs.monthly,
            gfsYearly: settings.gfs.yearly,
        };

        let updated;
        if (existing.length > 0) {
            updated = await db
                .update(drizzleDb.schemas.retentionPolicy)
                .set(values)
                .where(and(eq(ownerCol, scope.id), isNull(otherCol)))
                .returning();
        } else {
            updated = await db
                .insert(drizzleDb.schemas.retentionPolicy)
                .values({...owner, ...values})
                .returning();
        }
        return {data: updated[0]};
    });
