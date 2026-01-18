import {db} from "@/db";
import {subDays, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear} from "date-fns";
import {eq, desc, isNull, and} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";

export async function enforceRetentionGFS(databaseId: string, gfsSettings: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
}) {
    const backups = await db.query.backup.findMany({
        where: and(eq(drizzleDb.schemas.backup.databaseId, databaseId), isNull(drizzleDb.schemas.backup.deletedAt)),
        orderBy: desc(drizzleDb.schemas.backup.createdAt),
        with: {
            database: {
                with: {
                    project: true
                }
            }
        }
    });

    const now = new Date();
    const toKeep: Set<string> = new Set();

    // DAILY
    backups.forEach((b) => {
        if (b.createdAt >= subDays(now, gfsSettings.daily)) toKeep.add(b.id);
    });

    const weekStartDates = Array.from({length: gfsSettings.weekly}, (_, i) => startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }));
    weekStartDates.forEach((weekStart) => {
        const backupOfWeek = backups.find(
            (b) => b.createdAt >= weekStart && b.createdAt < subWeeks(weekStart, -1)
        );
        if (backupOfWeek) toKeep.add(backupOfWeek.id);
    });

    // MONTHLY
    const monthStartDates = Array.from({length: gfsSettings.monthly}, (_, i) => startOfMonth(subMonths(now, i)));
    monthStartDates.forEach((monthStart) => {
        const backupOfMonth = backups.find(
            (b) => b.createdAt >= monthStart && b.createdAt < subMonths(monthStart, -1)
        );
        if (backupOfMonth) toKeep.add(backupOfMonth.id);
    });

    // YEARLY
    const yearStartDates = Array.from({length: gfsSettings.yearly}, (_, i) => startOfYear(subYears(now, i)));
    yearStartDates.forEach((yearStart) => {
        const backupOfYear = backups.find(
            (b) => b.createdAt >= yearStart && b.createdAt < subYears(yearStart, -1)
        );
        if (backupOfYear) toKeep.add(backupOfYear.id);
    });

    // Delete backups not in `toKeep`
    for (const b of backups) {
        if (!toKeep.has(b.id)) {

            await deleteBackupCronAction({
                backupId: b.id,
                databaseId: b.databaseId,
            });
        }
    }
}
