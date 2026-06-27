"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { userAction } from "@/lib/safe-actions/actions";
import { ApplyDbSettingsSchema } from "@/features/onboarding/schemas/db-settings.schema";

export const applyOnboardingDbSettingsAction = userAction
  .schema(ApplyDbSettingsSchema)
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
            })),
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
            })),
          );
        }
      });
    };

    if (section === "retention" || section === "all") await applyRetention();
    if (section === "scheduling" || section === "all") await applyScheduling();
    if (section === "notifications" || section === "all")
      await applyNotifications();
    if (section === "storage" || section === "all") await applyStorage();

    return { success: true };
  });
