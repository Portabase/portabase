import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";

export async function getHealthDashboardPreferences(userId: string) {
    return db.query.healthDashboardPreference.findMany({
        where: and(
            eq(drizzleDb.schemas.healthDashboardPreference.userId, userId),
            eq(drizzleDb.schemas.healthDashboardPreference.visible, true)
        ),
    });
}

export async function getAllHealthDashboardPreferences(userId: string) {
    return db.query.healthDashboardPreference.findMany({
        where: eq(drizzleDb.schemas.healthDashboardPreference.userId, userId),
    });
}

export async function toggleHealthDashboardPreference(
    userId: string,
    databaseId: string,
    visible: boolean
) {
    const existing = await db.query.healthDashboardPreference.findFirst({
        where: and(
            eq(drizzleDb.schemas.healthDashboardPreference.userId, userId),
            eq(drizzleDb.schemas.healthDashboardPreference.databaseId, databaseId)
        ),
    });

    if (existing) {
        const [updated] = await db
            .update(drizzleDb.schemas.healthDashboardPreference)
            .set(withUpdatedAt({visible}))
            .where(eq(drizzleDb.schemas.healthDashboardPreference.id, existing.id))
            .returning();
        return updated;
    }

    const [created] = await db
        .insert(drizzleDb.schemas.healthDashboardPreference)
        .values({userId, databaseId, visible})
        .returning();
    return created;
}
