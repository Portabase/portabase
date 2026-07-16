import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Database} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";
import {deleteBackupService} from "@/lib/tasks/database/utils/backup-delete.service";
import {assertCanDeleteDatabase, DatabaseNotFoundError} from "@/features/database/utils/database-acl";

const log = logger.child({module: "features/database/delete"});

export type DeleteDatabaseInput = {
    databaseId: string;
};

export type DeleteDatabaseResult = {
    database: Database;
    failedBackupCount: number;
};

async function purgeDatabaseBackups(databaseId: string): Promise<number> {
    const backups = await db.query.backup.findMany({
        where: and(
            eq(drizzleDb.schemas.backup.databaseId, databaseId),
            isNull(drizzleDb.schemas.backup.deletedAt),
        ),
        columns: {id: true},
    });

    let failedBackupCount = 0;

    for (const backup of backups) {
        try {
            const result = await deleteBackupService(backup.id, databaseId);

            if (!result.ok || result.storageFailures > 0) {
                failedBackupCount++;
                log.error(
                    {
                        name: "purgeDatabaseBackups",
                        backupId: backup.id,
                        databaseId,
                        storageFailures: result.storageFailures,
                        cause: result.error,
                    },
                    "Backup purge reported a failure"
                );
            }
        } catch (error) {
            failedBackupCount++;
            log.error(
                {name: "purgeDatabaseBackups", backupId: backup.id, databaseId, error},
                "Backup purge threw"
            );
        }
    }

    return failedBackupCount;
}

export async function deleteDatabaseService(input: DeleteDatabaseInput): Promise<DeleteDatabaseResult> {
    const {databaseId} = input;

    await assertCanDeleteDatabase(databaseId);

    const failedBackupCount = await purgeDatabaseBackups(databaseId);

    await db
        .delete(drizzleDb.schemas.retentionPolicy)
        .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
        .execute();

    await db
        .delete(drizzleDb.schemas.alertPolicy)
        .where(eq(drizzleDb.schemas.alertPolicy.databaseId, databaseId))
        .execute();

    await db
        .delete(drizzleDb.schemas.storagePolicy)
        .where(eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId))
        .execute();

    const [updatedDatabase] = await db
        .update(drizzleDb.schemas.database)
        .set(
            withUpdatedAt({
                agentId: null,
                agentDatabaseId: null,
                projectId: null,
                backupPolicy: null,
                deletedAt: new Date(),
            })
        )
        .where(eq(drizzleDb.schemas.database.id, databaseId))
        .returning();

    if (!updatedDatabase) {
        throw new DatabaseNotFoundError(databaseId);
    }

    return {database: updatedDatabase, failedBackupCount};
}
