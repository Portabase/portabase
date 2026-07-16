"use server";

import {z} from "zod";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Database} from "@/db/schema/07_database";
import {ServerActionResult} from "@/types/action-type";
import {userAction} from "@/lib/safe-actions/actions";
import {zString} from "@/lib/zod";
import {withUpdatedAt} from "@/db/utils";
import {logger} from "@/lib/logger";
import {deleteBackupService} from "@/lib/tasks/database/utils/backup-delete.service";
import {
    AgentOnlineError,
    assertCanDeleteDatabase,
    DatabaseNotFoundError,
    UnauthorizedError,
} from "@/features/database/utils/database-acl";

const log = logger.child({module: "features/database/delete"});

type DeleteDatabaseInput = {
    databaseId: string;
};

type DeleteDatabaseResult = {
    database: Database;
    failedBackupCount: number;
};

/**
 * Purge tous les backups non supprimés de la database.
 * Tous statuts confondus : un backup "failed" peut avoir laissé un fichier partiel.
 * Un échec n'interrompt jamais la boucle — il est loggé et compté.
 *
 * Un backup compte comme échoué s'il est introuvable (ok: false) OU si au moins
 * un de ses fichiers a résisté au storage (storageFailures > 0) : dans les deux
 * cas l'utilisateur doit savoir qu'il reste quelque chose derrière.
 */
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

export const deleteDatabaseAction = userAction
    .schema(
        z.object({
            databaseId: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Database>> => {
        try {
            const {database, failedBackupCount} = await deleteDatabaseService(parsedInput);

            return {
                success: true,
                value: database,
                actionSuccess: {
                    message: "Database has been successfully deleted.",
                    messageParams: {
                        databaseId: parsedInput.databaseId,
                        failedBackupCount,
                    },
                },
            };
        } catch (error) {
            if (error instanceof AgentOnlineError) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent must be offline to delete a database.",
                        status: 409,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            if (error instanceof UnauthorizedError) {
                return {
                    success: false,
                    actionError: {
                        message: "Not authorized to delete this database.",
                        status: 403,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            if (error instanceof DatabaseNotFoundError) {
                return {
                    success: false,
                    actionError: {
                        message: "Database not found or update failed",
                        status: 404,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            return {
                success: false,
                actionError: {
                    message: "Failed to delete database.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {
                        databaseId: parsedInput.databaseId,
                    },
                },
            };
        }
    });
