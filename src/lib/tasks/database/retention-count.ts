import * as drizzleDb from "@/db";
import {db} from "@/db";
import {and, desc, eq, isNull} from "drizzle-orm";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";

export async function enforceRetentionCount(databaseId: string, count: number) {
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

    const toDelete = backups.slice(count); // keep first `count`, delete rest

    for (const b of toDelete) {
         await deleteBackupCronAction({
            backupId: b.id,
            databaseId: b.databaseId,
        });
    }
}