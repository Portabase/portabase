import {db} from "@/db";
import {eq, lt, and, desc, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";

export async function enforceRetentionDays(databaseId: string, days: number) {
    const cutoff = new Date(Date.now() - days * 86400000);

    const expiredBackups = await db.query.backup.findMany({
        where: and(
            eq(drizzleDb.schemas.backup.databaseId, databaseId),
            lt(drizzleDb.schemas.backup.createdAt, cutoff),
            isNull(drizzleDb.schemas.backup.deletedAt)
        ),
        with: {
            database: {
                with: {
                    project: true
                }
            }
        }
    });

    for (const backup of expiredBackups) {
        await deleteBackupCronAction({
            backupId: backup.id,
            databaseId: backup.databaseId,
        });

    }

}

