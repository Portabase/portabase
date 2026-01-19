import {db} from "@/db";
import {eq, lt, and, desc, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";

export async function enforceRetentionDays(databaseId: string, days: number) {
    console.log(`Enforce Retention Days starting for ${databaseId}`);
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

        const result = await deleteBackupCronAction({
            backupId: backup.id,
            databaseId: backup.databaseId,
        });

        const inner = result?.data;
        if (inner?.success) {
            console.log(`[Retention Days] - (databaseId:${backup.databaseId}) - (backupId: ${backup.id}) : successfully deleted`);
        } else {
            console.log(`[Retention Days] - (databaseId:${backup.databaseId}) - (backupId: ${backup.id}) : an error occurred - ${inner?.actionError?.message}`);
        }
    }

}

