import { db } from "@/db";
import { enforceRetentionCount } from "@/lib/tasks/database/retention-count";
import { enforceRetentionDays } from "@/lib/tasks/database/retention-days";
import { enforceRetentionGFS } from "@/lib/tasks/database/retention-gsf";
import { DatabaseWith, retentionPolicy } from "@/db/schema/07_database";
import { isNull } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { logger } from "@/lib/logger";
import { resolveRetentionPolicy } from "@/features/database/utils/policy-resolution";

const log = logger.child({ module: "tasks/database" });

export const retentionCleanTask = async () => {
  try {
    const databases = await db.query.database.findMany({
      where: isNull(drizzleDb.schemas.database.deletedAt),
      with: {
        retentionPolicy: true,
        project: { with: { retentionPolicy: true } },
        backups: {
          where: isNull(drizzleDb.schemas.backup.deletedAt),
        },
      },
    });
    log.info(`Retention databases number: ${databases.length}`);
    for (const dbRow of databases) {
      const policy = resolveRetentionPolicy(dbRow as DatabaseWith);
      if (!policy) continue;
      await enforceRetention(dbRow.id, policy);
    }
  } catch (e: any) {
    log.error({ error: e }, "Retention cleanup failed");
    throw e;
  }
};

export async function enforceRetention(
  databaseId: string,
  policy: typeof retentionPolicy.$inferSelect,
) {
  log.info({ name: "enforceRetention" }, `Retention started for ${databaseId}`);

  switch (policy.type) {
    case "count":
      await enforceRetentionCount(databaseId, policy.count ?? 7);
      break;

    case "days":
      await enforceRetentionDays(databaseId, policy.days ?? 30);
      break;

    case "gfs":
      await enforceRetentionGFS(databaseId, {
        hourly: policy.gfsHourly ?? 0,
        daily: policy.gfsDaily ?? 7,
        weekly: policy.gfsWeekly ?? 4,
        monthly: policy.gfsMonthly ?? 12,
        yearly: policy.gfsYearly ?? 3,
      });
      break;
  }
}
