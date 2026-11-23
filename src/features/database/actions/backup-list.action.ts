"use server";
import { ActionError, userAction } from "@/lib/safe-actions/actions";
import { db } from "@/db";
import { and, count, eq, inArray } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { BackupWith, RestorationWith } from "@/db/schema/07_database";
import {
    FetchBackupsSchema,
    FetchRestorationsSchema,
} from "@/features/database/actions/backup-list.schema";
import { assertCanReadDatabase } from "@/features/database/utils/database-acl";
import { expectedParents, loadChain } from "@/features/database/services/physical-chain.service";
import { chainGroups, descendantIdsOf, type ChainGroup } from "@/features/database/utils/physical-chain";
import { deletionStateCondition, filterCondition } from "@/db/utils";

export const fetchBackupsAction = userAction
    .inputSchema(FetchBackupsSchema)
    .action(async ({ parsedInput }) => {
        const { databaseId, page, pageSize, state, stateOperator, status, statusOperator } = parsedInput;
        try {
            await assertCanReadDatabase(databaseId);
        } catch {
            throw new ActionError("Not authorized");
        }
        const offset = (page - 1) * pageSize;

        const where = and(
            eq(drizzleDb.schemas.backup.databaseId, databaseId),
            deletionStateCondition(drizzleDb.schemas.backup.deletedAt, state, stateOperator),
            filterCondition(drizzleDb.schemas.backup.status, status, statusOperator),
        );

        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, databaseId),
            columns: { backupEngine: true, fullBackupCron: true },
        });
        const chain = database?.backupEngine === "physical" ? await loadChain(databaseId) : null;

        let total: number;
        let pageGroups: ChainGroup[] | null = null;
        if (database && chain) {
            const listedBackups = await db
                .select({ id: drizzleDb.schemas.backup.id })
                .from(drizzleDb.schemas.backup)
                .where(where);
            const expectedParentById = await expectedParents({ id: databaseId, fullBackupCron: database.fullBackupCron }, chain.nodes);
            const displayedNodes = chain.nodes.map((node) => {
                const expectedParentId = expectedParentById.get(node.id);
                return expectedParentId ? { ...node, parentBackupId: expectedParentId } : node;
            });
            const groups = chainGroups(displayedNodes, new Set(listedBackups.map((listedBackup) => listedBackup.id)));
            total = groups.length;
            pageGroups = groups.slice(offset, offset + pageSize);
        } else {
            const [totalResult] = await db
                .select({ count: count() })
                .from(drizzleDb.schemas.backup)
                .where(where);
            total = totalResult?.count ?? 0;
        }

        const pageBackupIds = pageGroups?.flatMap((group) => [group.headId, ...group.incrementalIds]);
        const data = pageBackupIds?.length === 0 ? [] : (await db.query.backup.findMany({
            where: pageBackupIds ? inArray(drizzleDb.schemas.backup.id, pageBackupIds) : where,
            with: {
                restorations: true,
                storages: {
                    with: {
                        storageChannel: {
                            columns: { id: true, name: true, provider: true },
                        },
                    },
                },
            },
            orderBy: (backup, { desc }) => [desc(backup.createdAt)],
            ...(pageBackupIds ? {} : { limit: pageSize, offset }),
        })) as BackupWith[];

        const backupIds = data.map((backup) => backup.id);
        const backupsWithLogs = backupIds.length
            ? await db
                .select({ backupId: drizzleDb.schemas.jobLog.backupId })
                .from(drizzleDb.schemas.jobLog)
                .where(inArray(drizzleDb.schemas.jobLog.backupId, backupIds))
                .groupBy(drizzleDb.schemas.jobLog.backupId)
            : [];
        const loggedBackupIds = new Set(backupsWithLogs.map((loggedBackup) => loggedBackup.backupId));
        for (const backup of data) {
            backup.hasLogs = loggedBackupIds.has(backup.id);
        }

        if (chain) {
            const createdAtById = new Map(chain.nodes.map((node) => [node.id, node.createdAt]));
            for (const backup of data) {
                backup.dependentBackups = descendantIdsOf(chain.nodes, backup.id).length;
                backup.parentCreatedAt = (backup.parentBackupId ? createdAtById.get(backup.parentBackupId) : undefined) ?? null;
            }
        }

        const backupsById = new Map(data.map((backup) => [backup.id, backup]));
        const backups = pageGroups
            ? pageGroups.flatMap((group) => {
                const head = backupsById.get(group.headId);
                if (!head) return [];
                head.incrementals = group.incrementalIds
                    .map((incrementalId) => backupsById.get(incrementalId))
                    .filter((incremental): incremental is BackupWith => incremental !== undefined);
                return [head];
            })
            : data;

        return {
            data: backups,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    });

export const fetchRestorationsAction = userAction
    .inputSchema(FetchRestorationsSchema)
    .action(async ({ parsedInput }) => {
        const { databaseId, page, pageSize, restorationStatus, restorationStatusOperator } = parsedInput;
        try {
            await assertCanReadDatabase(databaseId);
        } catch {
            throw new ActionError("Not authorized");
        }
        const offset = (page - 1) * pageSize;

        const where = and(
            eq(drizzleDb.schemas.restoration.databaseId, databaseId),
            filterCondition(drizzleDb.schemas.restoration.status, restorationStatus, restorationStatusOperator),
        );

        const [totalResult] = await db
            .select({ count: count() })
            .from(drizzleDb.schemas.restoration)
            .where(where);

        const data = (await db.query.restoration.findMany({
            where,
            orderBy: (r, { desc }) => [desc(r.createdAt)],
            limit: pageSize,
            offset,
        })) as RestorationWith[];

        const restorationIds = data.map((r) => r.id);
        const restorationsWithLogs = restorationIds.length
            ? await db
                .select({ restorationId: drizzleDb.schemas.jobLog.restorationId })
                .from(drizzleDb.schemas.jobLog)
                .where(inArray(drizzleDb.schemas.jobLog.restorationId, restorationIds))
                .groupBy(drizzleDb.schemas.jobLog.restorationId)
            : [];
        const loggedRestorationIds = new Set(
            restorationsWithLogs.map((l) => l.restorationId),
        );
        for (const r of data) {
            r.hasLogs = loggedRestorationIds.has(r.id);
        }

        const total = totalResult?.count ?? 0;
        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    });
