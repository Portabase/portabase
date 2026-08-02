import { db } from "@/db";
import {
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { eq, desc, isNull, and } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { deleteBackupCronAction } from "@/lib/tasks/database/utils/delete";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "tasks/database/retention-gsf" });

export async function enforceRetentionGFS(
  databaseId: string,
  gfsSettings: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  },
) {
  log.info(
    { name: "enforceRetentionGFS" },
    `Retention GFS started for databaseId: ${databaseId}`,
  );

  const backups = await db.query.backup.findMany({
    where: and(
      eq(drizzleDb.schemas.backup.databaseId, databaseId),
      isNull(drizzleDb.schemas.backup.deletedAt),
    ),
    orderBy: desc(drizzleDb.schemas.backup.createdAt),
    with: {
      database: {
        with: {
          project: true,
        },
      },
    },
  });

  const now = new Date();
  const toKeep: Set<string> = new Set();

  const hourWindowStart =
    gfsSettings.hourly > 0
      ? startOfHour(subHours(now, gfsSettings.hourly - 1)).getTime()
      : null;
  const dayWindowStart =
    gfsSettings.daily > 0
      ? startOfDay(subDays(now, gfsSettings.daily - 1)).getTime()
      : null;
  const weekWindowStart =
    gfsSettings.weekly > 0
      ? startOfWeek(subWeeks(now, gfsSettings.weekly - 1), {
          weekStartsOn: 1,
        }).getTime()
      : null;
  const monthWindowStart =
    gfsSettings.monthly > 0
      ? startOfMonth(subMonths(now, gfsSettings.monthly - 1)).getTime()
      : null;
  const yearWindowStart =
    gfsSettings.yearly > 0
      ? startOfYear(subYears(now, gfsSettings.yearly - 1)).getTime()
      : null;

  const seenHour = new Set<number>();
  const seenDay = new Set<number>();
  const seenWeek = new Set<number>();
  const seenMonth = new Set<number>();
  const seenYear = new Set<number>();

  for (const backup of backups) {
    const createdAt = backup.createdAt;

    if (hourWindowStart !== null) {
      const bucket = startOfHour(createdAt).getTime();
      if (bucket >= hourWindowStart && !seenHour.has(bucket)) {
        seenHour.add(bucket);
        toKeep.add(backup.id);
      }
    }

    if (dayWindowStart !== null) {
      const bucket = startOfDay(createdAt).getTime();
      if (bucket >= dayWindowStart && !seenDay.has(bucket)) {
        seenDay.add(bucket);
        toKeep.add(backup.id);
      }
    }

    if (weekWindowStart !== null) {
      const bucket = startOfWeek(createdAt, { weekStartsOn: 1 }).getTime();
      if (bucket >= weekWindowStart && !seenWeek.has(bucket)) {
        seenWeek.add(bucket);
        toKeep.add(backup.id);
      }
    }

    if (monthWindowStart !== null) {
      const bucket = startOfMonth(createdAt).getTime();
      if (bucket >= monthWindowStart && !seenMonth.has(bucket)) {
        seenMonth.add(bucket);
        toKeep.add(backup.id);
      }
    }

    if (yearWindowStart !== null) {
      const bucket = startOfYear(createdAt).getTime();
      if (bucket >= yearWindowStart && !seenYear.has(bucket)) {
        seenYear.add(bucket);
        toKeep.add(backup.id);
      }
    }
  }

  for (const b of backups) {
    if (!toKeep.has(b.id)) {
      const result = await deleteBackupCronAction({
        backupId: b.id,
        databaseId: b.databaseId,
      });

      const inner = result?.data;
      if (inner?.success) {
        log.info(
          { name: "enforceRetentionGFS" },
          `(databaseId:${b.databaseId}) - (backupId: ${b.id}) : successfully deleted`,
        );
      } else {
        log.info(
          { name: "enforceRetentionGFS" },
          `(databaseId:${b.databaseId}) - (backupId: ${b.id}) : an error occurred - ${inner?.actionError?.message}`,
        );
      }
    }
  }
}
