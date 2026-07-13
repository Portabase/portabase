import {db} from "@/db";
import {and, eq, isNotNull, isNull, lt} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";
import {env} from "@/env.mjs";
import {sendNotificationsBackupRestore} from "@/features/notifications/utils/notifications.helpers";

const log = logger.child({module: "tasks/cleaning"});

export const backupCleanTask = async () => {
    try {
        const ongoingBackups = await db.query.backup.findMany({
            where: and(
                isNotNull(drizzleDb.schemas.backup.deletedAt),
                eq(drizzleDb.schemas.backup.status, "ongoing")
            )
        });
        log.debug(`Backups to clean: ${ongoingBackups.length}`);

        for (const backup of ongoingBackups) {
            await db.update(drizzleDb.schemas.backup).set(withUpdatedAt({
                status: "failed",
            }))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));
        }

        const staleCutoff = new Date(Date.now() - env.STALE_BACKUP_THRESHOLD_HOURS * 60 * 60 * 1000);

        const staleOngoingBackups = await db.query.backup.findMany({
            where: and(
                isNull(drizzleDb.schemas.backup.deletedAt),
                eq(drizzleDb.schemas.backup.status, "ongoing"),
                lt(drizzleDb.schemas.backup.createdAt, staleCutoff)
            )
        });
        log.debug(`Stale ongoing backups to fail: ${staleOngoingBackups.length}`);

        for (const backup of staleOngoingBackups) {
            await db.update(drizzleDb.schemas.backup).set(withUpdatedAt({
                status: "failed",
            }))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));

            try {
                const database = await db.query.database.findFirst({
                    where: and(
                        eq(drizzleDb.schemas.database.id, backup.databaseId),
                        isNull(drizzleDb.schemas.database.deletedAt),
                    ),
                    with: {alertPolicies: true},
                });
                if (database) {
                    await sendNotificationsBackupRestore(database, "error_backup");
                }
            } catch (notifyError) {
                log.error({name: "backupCleanTask", error: notifyError}, "Stale backup notification failed");
            }
        }

        const failedBackups = await db.query.backup.findMany({
            where: and(
                isNull(drizzleDb.schemas.backup.deletedAt),
                eq(drizzleDb.schemas.backup.status, "failed")
            )
        });
        log.debug(`Failed backups to clean: ${failedBackups.length}`);

        for (const backup of failedBackups) {
            await db.update(drizzleDb.schemas.backup).set(withUpdatedAt({
                deletedAt: new Date(),
            }))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));
        }

    } catch (e: any) {
        log.error({name: "backupCleanTask", error: e},`Backup cleanup failed`);
        throw e;
    }
};