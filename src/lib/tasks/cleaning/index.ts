import {db} from "@/db";
import {and, eq, isNotNull, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";

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