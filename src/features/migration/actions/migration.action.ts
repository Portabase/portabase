"use server"
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {v4 as uuidv4} from "uuid";
import {getTodayISODate} from "@/utils/date-formatting";
import {withUpdatedAt} from "@/db/utils";
import {getBackupExtension, getBackupFolderName} from "@/utils/file-prefix";
import {assertCanReadDatabase} from "@/features/database/utils/database-acl";
import {isDownloadable} from "@/features/database/utils/backup-method";
import {loadChain} from "@/features/database/services/physical-chain.service";
import {migrationChainIds} from "@/features/database/utils/physical-chain";
import type {BackupStorage} from "@/db/schema/14_storage-backup";

const isLive = (storage: BackupStorage) => storage.deletedAt === null;
const isUsable = (storage: BackupStorage) => isLive(storage) && storage.status === "success";
const isPhysicalBackup = (backup: {storages: BackupStorage[]}) =>
    backup.storages.some((storage) => isLive(storage) && storage.engine === "physical");
const rejected = (message: string) => ({success: false as const, actionError: {message, status: 400}});

export const migrationAction = userAction.inputSchema(
    z.object({
        targetDatabaseId: z.string(),
        backupIds: z.array(z.string()),
    })
).action(async ({parsedInput}): Promise<ServerActionResult<{}>> => {

    const {targetDatabaseId, backupIds} = parsedInput;

    const selected = await db.query.backup.findMany({
        where: inArray(drizzleDb.schemas.backup.id, backupIds),
        with: {storages: true},
    });
    for (const databaseId of new Set([targetDatabaseId, ...selected.map((b) => b.databaseId)])) {
        try {
            await assertCanReadDatabase(databaseId);
        } catch {
            throw new ActionError("Not authorized");
        }
    }

    let hasError = false;

    try {

        const targetDatabase = await db.query.database.findFirst({
            where: and(
                eq(drizzleDb.schemas.database.id, targetDatabaseId),
                isNull(drizzleDb.schemas.database.deletedAt),
            ),
            with: {
                project: true,
                retentionPolicy: true,
                alertPolicies: true,
                storagePolicies: true
            }
        });

        if (!targetDatabase) {
            return {
                success: false,
                actionError: {
                    message: "Unable to find target database",
                    status: 404,
                },
            };
        }

        if (selected.length !== backupIds.length) {
            return rejected("Some backups were not found");
        }

        if (selected.some((b) => b.storages.some((s) => isLive(s) && !isDownloadable(s.engine)))) {
            return rejected("Snapshot, sync and copy backups cannot be migrated.");
        }

        const targetIsPhysical = targetDatabase.backupEngine === "physical";
        if (selected.some((backup) => isPhysicalBackup(backup) !== targetIsPhysical)) {
            return rejected(targetIsPhysical
                ? "A source using the physical method only accepts physical backups."
                : "Physical backups can only be migrated to a source using the physical method.");
        }

        let backups = selected;
        if (targetIsPhysical) {
            const chainIds: string[] = [];
            for (const databaseId of new Set(selected.map((backup) => backup.databaseId))) {
                const {nodes, storages} = await loadChain(databaseId);
                const selectedIds = selected.filter((backup) => backup.databaseId === databaseId).map((backup) => backup.id);
                const ids = migrationChainIds(nodes, storages, selectedIds);
                if (!ids) {
                    return rejected("A selected backup cannot be migrated: its full backup or an earlier incremental is missing or failed.");
                }
                chainIds.push(...ids);
            }
            backups = await db.query.backup.findMany({
                where: inArray(drizzleDb.schemas.backup.id, chainIds),
                with: {storages: true},
            });
        }

        if (backups.some((backup) => !backup.storages.some(isUsable))) {
            return rejected("Some backups have no available copy to migrate.");
        }

        const migrations = backups
            .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime())
            .map((backup) => ({backup, migratedId: uuidv4()}));
        const migratedIdBySourceId = new Map(migrations.map(({backup, migratedId}) => [backup.id, migratedId]));

        for (const {backup, migratedId} of migrations) {
            await db.insert(drizzleDb.schemas.backup).values({
                id: migratedId,
                status: "ongoing",
                databaseId: targetDatabaseId,
                fileSize: backup.fileSize,
                migrated: true,
                parentBackupId: backup.parentBackupId ? migratedIdBySourceId.get(backup.parentBackupId) ?? null : null,
            });
        }

        await Promise.all(
            migrations.map(async ({backup, migratedId}) => {

                const storageResults = await Promise.allSettled(
                    backup.storages.filter(isUsable).map(async (storage) => {

                        const [backupStorage] = await db
                            .insert(drizzleDb.schemas.backupStorage)
                            .values({
                                backupId: migratedId,
                                storageChannelId: storage.storageChannelId,
                                status: "pending",
                                engine: storage.engine,
                            })
                            .returning();

                        const fileName = `${uuidv4()}${getBackupExtension(storage.path ?? "")}`;
                        const pathTo = `${getBackupFolderName()}/${getTodayISODate()}/${fileName}`;

                        try {
                            const result = await dispatchStorage(
                                {
                                    action: "copy",
                                    data: {
                                        from: storage.path ?? "",
                                        to: pathTo,
                                    },
                                    metadata: {
                                        storageId: storage.storageChannelId,
                                        fileKind: "backups",
                                    },
                                },
                                undefined,
                                storage.storageChannelId
                            );

                            if (!result.success) {
                                hasError = true;
                                throw new Error("dispatchStorage failed");
                            }

                            await db
                                .update(drizzleDb.schemas.backupStorage)
                                .set(
                                    withUpdatedAt({
                                        status: "success",
                                        path: pathTo,
                                        size: backup.fileSize,
                                    })
                                )
                                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

                            return {success: true};

                        } catch (error) {

                            hasError = true;

                            await db
                                .update(drizzleDb.schemas.backupStorage)
                                .set(
                                    withUpdatedAt({
                                        status: "failed",
                                    })
                                )
                                .where(eq(drizzleDb.schemas.backupStorage.id, backupStorage.id));

                            return {success: false};
                        }
                    })
                );

                const failed = storageResults.some(
                    r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)
                );

                if (failed) hasError = true;

                await db
                    .update(drizzleDb.schemas.backup)
                    .set(
                        withUpdatedAt({
                            status: failed ? "failed" : "success",
                        })
                    )
                    .where(eq(drizzleDb.schemas.backup.id, migratedId));

            })
        );

        if (hasError) {
            return {
                success: false,
                actionError: {
                    message: "Migration completed with errors",
                    status: 500,
                },
            };
        }

        return {
            success: true,
            value: {},
            actionSuccess: {
                message: `${backups.length} backup(s) migrated.`,
                messageParams: {},
            },
        };

    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "Migration failed unexpectedly",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});
