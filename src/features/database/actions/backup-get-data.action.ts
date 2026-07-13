"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {db} from "@/db";
import {and, count, eq, inArray, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {getOrganizationChannels} from "@/db/services/notification-channel";
import {getOrganizationStorageChannels} from "@/db/services/storage-channel";
import {getHealthLast12hLogs} from "@/db/services/healthcheck";

export const getDatabaseDataAction = userAction
    .schema(
        z.object({
            databaseId: z.string(),
        })
    )
    .action(async ({parsedInput}) => {
        const {databaseId} = parsedInput;

        const database = await db.query.database.findFirst({
            where: and(
                eq(drizzleDb.schemas.database.id, databaseId),
                isNull(drizzleDb.schemas.database.deletedAt),
            ),
            with: {
                project: true,
                retentionPolicy: true,
                alertPolicies: true,
                storagePolicies: true
            }
        });

        const [totalRow] = await db
            .select({count: count()})
            .from(drizzleDb.schemas.backup)
            .where(eq(drizzleDb.schemas.backup.databaseId, databaseId));
        const totalBackups = totalRow?.count ?? 0;

        const [availableRow] = await db
            .select({count: count()})
            .from(drizzleDb.schemas.backup)
            .where(and(
                eq(drizzleDb.schemas.backup.databaseId, databaseId),
                isNull(drizzleDb.schemas.backup.deletedAt),
            ));
        const availableBackups = availableRow?.count ?? 0;

        const [successRow] = await db
            .select({count: count()})
            .from(drizzleDb.schemas.backup)
            .where(and(
                eq(drizzleDb.schemas.backup.databaseId, databaseId),
                eq(drizzleDb.schemas.backup.status, "success"),
            ));
        const successfulBackups = successRow?.count ?? 0;

        const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : null;

        const [activeBackupRow] = await db
            .select({count: count()})
            .from(drizzleDb.schemas.backup)
            .where(and(
                eq(drizzleDb.schemas.backup.databaseId, databaseId),
                inArray(drizzleDb.schemas.backup.status, ["waiting", "ongoing"]),
            ));
        const isAlreadyBackup = (activeBackupRow?.count ?? 0) > 0;

        const [activeRestoreRow] = await db
            .select({count: count()})
            .from(drizzleDb.schemas.restoration)
            .where(and(
                eq(drizzleDb.schemas.restoration.databaseId, databaseId),
                eq(drizzleDb.schemas.restoration.status, "waiting"),
            ));
        const isAlreadyRestore = (activeRestoreRow?.count ?? 0) > 0;

        // @ts-ignore
        let activeOrganizationChannels = [];
        // @ts-ignore
        let activeOrganizationStorageChannels = [];

        if (database?.project?.organizationId) {
            const organizationChannels = await getOrganizationChannels(database.project.organizationId);
            activeOrganizationChannels = organizationChannels.filter(channel => channel.enabled);

            const organizationStorageChannels = await getOrganizationStorageChannels(database.project.organizationId);
            activeOrganizationStorageChannels = organizationStorageChannels.filter(channel => channel.enabled);
        }

        return {
            database,
            // @ts-ignore
            activeOrganizationChannels,
            // @ts-ignore
            activeOrganizationStorageChannels,
            stats: {
                totalBackups,
                availableBackups,
                successRate
            },
            isAlreadyRestore,
            isAlreadyBackup,
            health: database ? await getHealthLast12hLogs({id: database.id}) : []
        };
    });
