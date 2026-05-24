"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {BackupWith, Restoration} from "@/db/schema/07_database";
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
            where: eq(drizzleDb.schemas.database.id, databaseId),
            with: {
                project: true,
                retentionPolicy: true,
                alertPolicies: true,
                storagePolicies: true
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
            backups,
            restorations,
            // @ts-ignore
            activeOrganizationChannels,
            // @ts-ignore
            activeOrganizationStorageChannels,
            stats: {
                totalBackups,
                availableBackups,
                successRate
            },
            health: database ? await getHealthLast12hLogs({ id: database.id }) : []
        };
    });