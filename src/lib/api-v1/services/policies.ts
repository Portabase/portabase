import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { withUpdatedAt } from "@/db/utils";

// ---- Backup schedule (database.backupPolicy free-text cron) ----

export async function setBackupPolicy(databaseId: string, schedule: string | null) {
  const [updated] = await db
    .update(drizzleDb.schemas.database)
    .set(withUpdatedAt({ backupPolicy: schedule }))
    .where(eq(drizzleDb.schemas.database.id, databaseId))
    .returning({ id: drizzleDb.schemas.database.id, backupPolicy: drizzleDb.schemas.database.backupPolicy });
  return updated;
}
