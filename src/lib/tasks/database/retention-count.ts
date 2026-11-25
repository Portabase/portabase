import * as drizzleDb from "@/db";
import {db} from "@/db";
import {and, desc, eq, isNull} from "drizzle-orm";
import {deleteBackupCronAction} from "@/lib/tasks/database/utils/delete";
import {deletableAfterRetention} from "@/features/database/utils/physical-chain";
import {loadChain} from "@/features/database/services/physical-chain.service";
import {logger} from "@/lib/logger";

const log = logger.child({module: "tasks/database/retention-count"});

export async function enforceRetentionCount(databaseId: string, count: number) {
    log.info({ name: "enforceRetentionCount"}, `Retention count started for databaseId: ${databaseId}`);
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

    const {nodes} = await loadChain(databaseId);
    const expiredBackups = backups.slice(count);
    const deletableIds = new Set(deletableAfterRetention(nodes, expiredBackups.map((backup) => backup.id)));
    const toDelete = expiredBackups.filter((backup) => deletableIds.has(backup.id));
    log.info({ name: "enforceRetentionCount"}, `Found ${toDelete.length} backups to delete for databaseId: ${databaseId}`);

    for (const b of toDelete) {
        const result = await deleteBackupCronAction({
            backupId: b.id,
            databaseId: b.databaseId,
        });

        const inner = result?.data;
        if (inner?.success) {
            log.info({ name: "enforceRetentionCount"}, `(databaseId:${b.databaseId}) - (backupId: ${b.id}) : successfully deleted`);
        } else {
            log.info({ name: "enforceRetentionCount"}, `(databaseId:${b.databaseId}) - (backupId: ${b.id}) : an error occurred - ${inner?.actionError?.message}`);
        }
    }
}