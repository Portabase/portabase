import {db} from "@/db";
import {and, eq, isNotNull, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";

const log = logger.child({module: "tasks/cleaning"});

export const backupCleanTask = async () => {
    try {
        const backups = await db.query.backup.findMany({
            where: and(
                isNotNull(drizzleDb.schemas.backup.deletedAt),
                eq(drizzleDb.schemas.backup.status, "ongoing")
            )
        });
        log.info(`Backups to clean: ${backups.length}`);

        for (const backup of backups) {
            await db.update(drizzleDb.schemas.backup).set(withUpdatedAt({
                status: "failed",
            }))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));
        }

    } catch (e: any) {
        log.info({name: "backupCleanTask", error: e},`Backup cleanup failed`);
        throw e;
    }
};