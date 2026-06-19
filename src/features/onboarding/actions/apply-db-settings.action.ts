"use server";

import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { userAction } from "@/lib/safe-actions/actions";

const RetentionSchema = z.object({
  type: z.enum(["count", "days", "gfs"]).optional(),
  count: z.number().min(1).max(100),
  days: z.number().min(1).max(3650),
  gfs: z.object({
    daily: z.number().min(1).max(31),
    weekly: z.number().min(0).max(52),
    monthly: z.number().min(0).max(120),
    yearly: z.number().min(0).max(50),
  }),
});

const EventKindSchema = z.enum([
  "error_backup",
  "error_restore",
  "success_restore",
  "success_backup",
  "weekly_report",
  "error_health_agent",
  "error_health_database",
]);

const NotifPolicySchema = z.object({
  channelId: z.string().min(1),
  eventKinds: z.array(EventKindSchema),
  enabled: z.boolean(),
});

const StoragePolicyInputSchema = z.object({
  channelId: z.string().min(1),
  enabled: z.boolean(),
});

export const applyOnboardingDbSettingsAction = userAction
  .schema(
    z.object({
      databaseId: z.string().min(1),
      section: z.enum(["retention", "scheduling", "notifications", "storage", "all"]),
      retention: RetentionSchema.optional(),
      backupMethod: z.enum(["manual", "automatic"]).optional(),
      backupCron: z.string().optional(),
      notificationPolicies: z.array(NotifPolicySchema).optional(),
      storagePolicies: z.array(StoragePolicyInputSchema).optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const {
      databaseId,
      section,
      retention,
      backupMethod,
      backupCron,
      notificationPolicies,
      storagePolicies,
    } = parsedInput;

    const applyRetention = async () => {
      if (!retention) return;
      const existing = await db
        .select()
        .from(drizzleDb.schemas.retentionPolicy)
        .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
        .limit(1);

      const values = {
        type: retention.type ?? "gfs",
        count: retention.count,
        days: retention.days,
        gfsDaily: retention.gfs.daily,
        gfsWeekly: retention.gfs.weekly,
        gfsMonthly: retention.gfs.monthly,
        gfsYearly: retention.gfs.yearly,
      };

      if (existing.length > 0) {
        await db
          .update(drizzleDb.schemas.retentionPolicy)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId));
      } else {
        await db
          .insert(drizzleDb.schemas.retentionPolicy)
          .values({ databaseId, ...values });
      }
    };

    const applyScheduling = async () => {
      if (backupMethod === undefined) return;
      // Direct DB update — intentionally skips the side effect in
      // updateDatabaseBackupPolicyAction that deletes retention policy on null.
      const cronValue =
        backupMethod === "manual" ? null : (backupCron ?? "0 0 * * *");
      await db
        .update(drizzleDb.schemas.database)
        .set({ backupPolicy: cronValue, updatedAt: new Date() })
        .where(eq(drizzleDb.schemas.database.id, databaseId));
    };

    const applyNotifications = async () => {
      if (!notificationPolicies) return;
      await db.transaction(async (tx) => {
        await tx
          .delete(drizzleDb.schemas.alertPolicy)
          .where(eq(drizzleDb.schemas.alertPolicy.databaseId, databaseId));

        if (notificationPolicies.length > 0) {
          await tx.insert(drizzleDb.schemas.alertPolicy).values(
            notificationPolicies.map((p) => ({
              databaseId,
              notificationChannelId: p.channelId,
              eventKinds: p.eventKinds as any,
              enabled: p.enabled,
            }))
          );
        }
      });
    };

    const applyStorage = async () => {
      if (!storagePolicies) return;
      await db.transaction(async (tx) => {
        await tx
          .delete(drizzleDb.schemas.storagePolicy)
          .where(eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId));

        if (storagePolicies.length > 0) {
          await tx.insert(drizzleDb.schemas.storagePolicy).values(
            storagePolicies.map((p) => ({
              databaseId,
              storageChannelId: p.channelId,
              enabled: p.enabled,
            }))
          );
        }
      });
    };

    if (section === "retention" || section === "all") await applyRetention();
    if (section === "scheduling" || section === "all") await applyScheduling();
    if (section === "notifications" || section === "all") await applyNotifications();
    if (section === "storage" || section === "all") await applyStorage();

    return { success: true };
  });
