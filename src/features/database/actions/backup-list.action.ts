"use server";
import { userAction } from "@/lib/safe-actions/actions";
import { db } from "@/db";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { BackupWith, RestorationWith } from "@/db/schema/07_database";
import {
    FetchBackupsSchema,
    FetchRestorationsSchema,
} from "@/features/database/actions/backup-list.schema";

export const fetchBackupsAction = userAction
    .schema(FetchBackupsSchema)
    .action(async ({ parsedInput }) => {
        const { databaseId, page, pageSize, filter } = parsedInput;
        const offset = (page - 1) * pageSize;

        const deletedCondition =
            filter === "available"
                ? isNull(drizzleDb.schemas.backup.deletedAt)
                : filter === "deleted"
                    ? isNotNull(drizzleDb.schemas.backup.deletedAt)
                    : undefined;

        const where = and(
            eq(drizzleDb.schemas.backup.databaseId, databaseId),
            deletedCondition,
        );

        const [totalResult] = await db
            .select({ count: count() })
            .from(drizzleDb.schemas.backup)
            .where(where);

        const data = (await db.query.backup.findMany({
            where,
            with: {
                restorations: true,
                storages: {
                    with: {
                        storageChannel: true,
                    },
                },
            },
            orderBy: (b, { desc }) => [desc(b.createdAt)],
            limit: pageSize,
            offset,
        })) as BackupWith[];

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

export const fetchRestorationsAction = userAction
    .schema(FetchRestorationsSchema)
    .action(async ({ parsedInput }) => {
        const { databaseId, page, pageSize } = parsedInput;
        const offset = (page - 1) * pageSize;

        const where = eq(drizzleDb.schemas.restoration.databaseId, databaseId);

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
