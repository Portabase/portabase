import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {RetentionPolicy} from "@/db/schema/07_database";
import {RetentionSettings} from "@/features/database/schemas/retention-policy.schema";
import {PolicyScope, scopeOwner} from "@/features/database/schemas/policy-scope.schema";

export async function upsertRetentionPolicyService(
    scope: PolicyScope,
    settings: RetentionSettings
): Promise<RetentionPolicy> {
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

    const [updated] = existing.length > 0
        ? await db
            .update(drizzleDb.schemas.retentionPolicy)
            .set(values)
            .where(and(eq(ownerCol, scope.id), isNull(otherCol)))
            .returning()
        : await db
            .insert(drizzleDb.schemas.retentionPolicy)
            .values({...owner, ...values})
            .returning();

    return updated;
}
