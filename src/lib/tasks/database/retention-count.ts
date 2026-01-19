import * as drizzleDb from "@/db";
import {db} from "@/db";
import {and, desc, eq, isNull} from "drizzle-orm";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";
import {toast} from "sonner";

export async function enforceRetentionCount(databaseId: string, count: number) {
    console.log(`[Retention Count] - ${databaseId} : started`);
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

    const toDelete = backups.slice(count);
    console.log(`[Retention Count] - ${databaseId} : ${toDelete.length} backups to delete`);

    for (const b of toDelete) {
        const result = await deleteBackupCronAction({
            backupId: b.id,
            databaseId: b.databaseId,
        });

        const inner = result?.data;
        if (inner?.success) {
            console.log(`[Retention Count] - (databaseId:${b.databaseId}) - (backupId: ${b.id}) : successfully deleted`);
        } else {
            console.log(`[Retention Count] - (databaseId:${b.databaseId}) - (backupId: ${b.id}) : an error occurred - ${inner?.actionError?.message}`);
        }
    }
}