"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {BackupWith, Restoration} from "@/db/schema/07_database";

export const getDatabaseDataAction = userAction
    .schema(
        z.object({
            databaseId: z.string(),
        })
    )
    .action(async ({parsedInput}) => {
        const {databaseId} = parsedInput;

        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, databaseId),
            with: {
                project: true,
            }
        });

        const backups = await db.query.backup.findMany({
            where: eq(drizzleDb.schemas.backup.databaseId, databaseId),
            with: {
                restorations: true,
                storages: {
                    with: {
                        storageChannel: true
                    }
                }
            },
            orderBy: (b, {desc}) => [desc(b.createdAt)],
        }) as BackupWith[];

        const restorations = await db.query.restoration.findMany({
            where: eq(drizzleDb.schemas.restoration.databaseId, databaseId),
            orderBy: (r, {desc}) => [desc(r.createdAt)],
        }) as Restoration[];

        const totalBackups = backups.length;
        const availableBackups = backups.filter(b => !b.deletedAt).length;
        const successfulBackups = backups.filter(b => b.status === "success").length;
        const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : null;

        return {
            database,
            backups,
            restorations,
            stats: {
                totalBackups,
                availableBackups,
                successRate
            }
        };
    });