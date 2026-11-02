import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Restoration} from "@/db/schema/07_database";

export async function rerunRestorationService(restorationId: string): Promise<Restoration | undefined> {
    const [updated] = await db
        .update(drizzleDb.schemas.restoration)
        .set({status: "waiting"})
        .where(eq(drizzleDb.schemas.restoration.id, restorationId))
        .returning();

    await db
        .delete(drizzleDb.schemas.jobLog)
        .where(eq(drizzleDb.schemas.jobLog.restorationId, restorationId));

    return updated;
}

export async function deleteRestorationService(restorationId: string): Promise<void> {
    await db
        .delete(drizzleDb.schemas.restoration)
        .where(eq(drizzleDb.schemas.restoration.id, restorationId));

    await db
        .delete(drizzleDb.schemas.jobLog)
        .where(eq(drizzleDb.schemas.jobLog.restorationId, restorationId));
}
