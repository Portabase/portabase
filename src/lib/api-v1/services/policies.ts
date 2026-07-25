import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq } from "drizzle-orm";
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

// ---- Retention policy (1:1 with database, upsert) ----

export type RetentionInput = {
  type: "count" | "days" | "gfs";
  count?: number;
  days?: number;
  gfsDaily?: number;
  gfsWeekly?: number;
  gfsMonthly?: number;
  gfsYearly?: number;
};

export async function getRetentionPolicy(databaseId: string) {
  return db.query.retentionPolicy.findFirst({
    where: eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId),
  });
}

export async function upsertRetentionPolicy(databaseId: string, input: RetentionInput) {
  const existing = await getRetentionPolicy(databaseId);
  if (existing) {
    const [updated] = await db
      .update(drizzleDb.schemas.retentionPolicy)
      .set(withUpdatedAt(input))
      .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(drizzleDb.schemas.retentionPolicy)
    .values({ databaseId, ...input })
    .returning();
  return created;
}

export async function deleteRetentionPolicy(databaseId: string): Promise<boolean> {
  const deleted = await db
    .delete(drizzleDb.schemas.retentionPolicy)
    .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
    .returning({ id: drizzleDb.schemas.retentionPolicy.id });
  return deleted.length > 0;
}

// ---- Storage policies (N per database) ----

/** A storage channel must belong to the database's organization. */
export async function isChannelInDatabaseOrg(
  databaseId: string,
  storageChannelId: string
): Promise<boolean> {
  const database = await db.query.database.findFirst({
    where: eq(drizzleDb.schemas.database.id, databaseId),
    columns: { id: true, projectId: true },
    with: { project: { columns: { organizationId: true } } },
  });
  const orgId = database?.project?.organizationId;
  if (!orgId) return false;

  const channel = await db.query.storageChannel.findFirst({
    where: eq(drizzleDb.schemas.storageChannel.id, storageChannelId),
    columns: { id: true, organizationId: true },
  });
  return channel?.organizationId === orgId;
}

export async function listStoragePolicies(databaseId: string) {
  return db.query.storagePolicy.findMany({
    where: eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId),
  });
}

export async function storagePolicyExists(
  databaseId: string,
  storageChannelId: string
): Promise<boolean> {
  const existing = await db.query.storagePolicy.findFirst({
    where: and(
      eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId),
      eq(drizzleDb.schemas.storagePolicy.storageChannelId, storageChannelId)
    ),
    columns: { id: true },
  });
  return Boolean(existing);
}

export async function createStoragePolicy(input: {
  databaseId: string;
  storageChannelId: string;
  enabled: boolean;
}) {
  const [created] = await db
    .insert(drizzleDb.schemas.storagePolicy)
    .values(input)
    .returning();
  return created;
}

export async function updateStoragePolicy(
  databaseId: string,
  policyId: string,
  enabled: boolean
) {
  const [updated] = await db
    .update(drizzleDb.schemas.storagePolicy)
    .set(withUpdatedAt({ enabled }))
    .where(
      and(
        eq(drizzleDb.schemas.storagePolicy.id, policyId),
        eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId)
      )
    )
    .returning();
  return updated;
}

export async function deleteStoragePolicy(
  databaseId: string,
  policyId: string
): Promise<boolean> {
  const deleted = await db
    .delete(drizzleDb.schemas.storagePolicy)
    .where(
      and(
        eq(drizzleDb.schemas.storagePolicy.id, policyId),
        eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId)
      )
    )
    .returning({ id: drizzleDb.schemas.storagePolicy.id });
  return deleted.length > 0;
}
