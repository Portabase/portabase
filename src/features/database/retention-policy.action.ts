"use server"

import {z} from "zod"
import {db} from "@/db"
import {eq} from "drizzle-orm"
import * as drizzleDb from "@/db";
import {
    RetentionSettingsSchema
} from "@/features/database/retention-policy.schema";
import {userAction} from "@/lib/safe-actions/actions";


export const updateOrCreateBackupRetentionPolicyAction = userAction
    .schema(
        z.object({
            databaseId: z.string(),
            settings: RetentionSettingsSchema,
        })
    )
    .action(async ({parsedInput}) => {
        const {databaseId, settings} = parsedInput

        // Check if a retention policy already exists
        const existing = await db
            .select()
            .from(drizzleDb.schemas.retentionPolicy)
            .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
            .limit(1)

        let updated

        if (existing.length > 0) {
            // Update existing policy
            updated = await db
                .update(drizzleDb.schemas.retentionPolicy)
                .set({
                    type: settings.type,
                    count: settings.count,
                    days: settings.days,
                    gfsDaily: settings.gfs.daily,
                    gfsWeekly: settings.gfs.weekly,
                    gfsMonthly: settings.gfs.monthly,
                    gfsYearly: settings.gfs.yearly,
                })
                .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
                .returning()
        } else {
            // Insert new policy

            updated = await db
                .insert(drizzleDb.schemas.retentionPolicy)
                .values({
                    databaseId,
                    type: settings.type ?? "gfs",
                    count: settings.count,
                    days: settings.days,
                    gfsDaily: settings.gfs.daily,
                    gfsWeekly: settings.gfs.weekly,
                    gfsMonthly: settings.gfs.monthly,
                    gfsYearly: settings.gfs.yearly,
                })
                .returning()
        }
        return {
            data: updated[0],
        }
    })
