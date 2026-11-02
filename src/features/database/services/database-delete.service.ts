import {and, eq, inArray, isNull, ne, or, sql} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Database} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";
import {purgeRepo} from "@/lib/restic";
import {purgeSyncReplica} from "@/lib/sync";
import {deleteBackupService} from "@/lib/tasks/database/utils/backup-delete.service";
import {assertCanDeleteDatabase, DatabaseNotFoundError} from "@/features/database/utils/database-acl";
import {REPLICA_ENGINES} from "@/features/database/utils/backup-method";

const log = logger.child({module: "features/database/delete"});

export type DeleteDatabaseInput = {
    databaseId: string;
};

export type DeleteDatabaseResult = {
    database: Database;
    failedBackupCount: number;
};

async function purgeResticRepos(databaseId: string, generatedId: string | null): Promise<void> {
    if (!generatedId) return;
    const {backup, backupStorage, storageChannel} = drizzleDb.schemas;

    const channels = await db
        .selectDistinct({channelId: backupStorage.storageChannelId})
        .from(backupStorage)
        .innerJoin(backup, eq(backup.id, backupStorage.backupId))
        .innerJoin(storageChannel, eq(storageChannel.id, backupStorage.storageChannelId))
        .where(and(
            eq(backup.databaseId, databaseId),
            eq(backupStorage.engine, "restic"),
            or(ne(backupStorage.path, ""), eq(storageChannel.provider, "local")),
        ));

    for (const {channelId} of channels) {
        try {
            await purgeRepo(channelId, generatedId);
            await db
                .update(backupStorage)
                .set(withUpdatedAt({deletedAt: new Date()}))
                .where(and(
                    eq(backupStorage.storageChannelId, channelId),
                    eq(backupStorage.engine, "restic"),
                    isNull(backupStorage.deletedAt),
                    inArray(backupStorage.backupId, db.select({id: backup.id}).from(backup).where(eq(backup.databaseId, databaseId))),
                ));
        } catch (error) {
            log.error(
                {name: "purgeResticRepos", databaseId, channelId, error: error instanceof Error ? error.message : String(error)},
                "restic repository purge failed",
            );
        }
    }
}

async function purgeSyncReplicas(databaseId: string, generatedId: string | null): Promise<void> {
    if (!generatedId) return;
    const {backup, backupStorage} = drizzleDb.schemas;
    const channels = await db
        .selectDistinct({channelId: backupStorage.storageChannelId})
        .from(backupStorage)
        .innerJoin(backup, eq(backup.id, backupStorage.backupId))
        .where(and(
            eq(backup.databaseId, databaseId),
            inArray(backupStorage.engine, [...REPLICA_ENGINES]),
        ));
    for (const {channelId} of channels) {
        try {
            await purgeSyncReplica(channelId, generatedId);
        } catch (error) {
            log.error(
                {name: "purgeSyncReplicas", databaseId, channelId, error: error instanceof Error ? error.message : String(error)},
                "sync replica purge failed",
            );
        }
    }
}

async function purgeDatabaseBackups(databaseId: string): Promise<number> {
    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.id, databaseId),
        columns: {agentDatabaseId: true},
    });
    await purgeResticRepos(databaseId, database?.agentDatabaseId ?? null);
    await purgeSyncReplicas(databaseId, database?.agentDatabaseId ?? null);

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
                agentDatabaseId: sql`case when ${drizzleDb.schemas.database.config} is null then null else ${drizzleDb.schemas.database.agentDatabaseId} end`,
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
