"use server";

import {z} from "zod";
import {and, desc, eq, inArray, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {userAction, ActionError} from "@/lib/safe-actions/actions";
import {getOrganization} from "@/lib/auth/auth";

export async function assertDatabasesInOrgProject(projectId: string, databaseIds: string[]) {
    const organization = await getOrganization({});
    if (!organization) throw new ActionError("No active organization.");

    const project = await db.query.project.findFirst({
        where: and(
            eq(drizzleDb.schemas.project.id, projectId),
            eq(drizzleDb.schemas.project.organizationId, organization.id),
        ),
        with: {databases: {where: isNull(drizzleDb.schemas.database.deletedAt)}},
    });
    if (!project) throw new ActionError("Project not found.");

    const allowed = new Set(project.databases.map((d) => d.id));
    for (const id of databaseIds) {
        if (!allowed.has(id)) throw new ActionError("Database not in project.");
    }
}

export type RestorePreviewRow = {
    databaseId: string;
    name: string;
    backupId?: string;
    backupStorageId?: string;
    backupDate?: string;
    restorable: boolean;
    reason?: string;
};

async function resolveLatestRestorable(projectId: string, databaseIds: string[]): Promise<RestorePreviewRow[]> {
    const project = await db.query.project.findFirst({
        where: eq(drizzleDb.schemas.project.id, projectId),
        with: {databases: {where: isNull(drizzleDb.schemas.database.deletedAt)}},
    });
    const nameById = new Map((project?.databases ?? []).map((d) => [d.id, d.name] as const));

    const rows: RestorePreviewRow[] = [];
    for (const databaseId of databaseIds) {
        const activeRestore = await db.query.restoration.findFirst({
            where: and(
                eq(drizzleDb.schemas.restoration.databaseId, databaseId),
                inArray(drizzleDb.schemas.restoration.status, ["waiting", "ongoing"]),
            ),
        });
        if (activeRestore) {
            rows.push({
                databaseId,
                name: nameById.get(databaseId) ?? databaseId,
                restorable: false,
                reason: "restore already in progress",
            });
            continue;
        }

        const backups = await db.query.backup.findMany({
            where: and(
                eq(drizzleDb.schemas.backup.databaseId, databaseId),
                isNull(drizzleDb.schemas.backup.deletedAt),
            ),
            orderBy: desc(drizzleDb.schemas.backup.createdAt),
        });

        let picked: RestorePreviewRow | undefined;
        for (const backup of backups) {
            const storage = await db.query.backupStorage.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backupStorage.backupId, backup.id),
                    eq(drizzleDb.schemas.backupStorage.status, "success"),
                    isNull(drizzleDb.schemas.backupStorage.deletedAt),
                ),
                orderBy: desc(drizzleDb.schemas.backupStorage.createdAt),
            });
            if (storage) {
                picked = {
                    databaseId,
                    name: nameById.get(databaseId) ?? databaseId,
                    backupId: backup.id,
                    backupStorageId: storage.id,
                    backupDate: backup.createdAt?.toISOString(),
                    restorable: true,
                };
                break;
            }
        }

        rows.push(picked ?? {databaseId, name: nameById.get(databaseId) ?? databaseId, restorable: false, reason: "no successful backup"});
    }
    return rows;
}

const bulkSchema = z.object({
    projectId: z.uuid(),
    databaseIds: z.array(z.uuid()).min(1),
});

export const bulkRestorePreviewAction = userAction
    .schema(bulkSchema)
    .action(async ({parsedInput}): Promise<ServerActionResult<RestorePreviewRow[]>> => {
        try {
            const {projectId, databaseIds} = parsedInput;
            await assertDatabasesInOrgProject(projectId, databaseIds);
            const rows = await resolveLatestRestorable(projectId, databaseIds);
            return {success: true, value: rows};
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to build restore preview.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });

export const bulkRestoreLatestAction = userAction
    .schema(bulkSchema)
    .action(async ({parsedInput}): Promise<ServerActionResult<{queued: number; skipped: {databaseId: string; reason: string}[]}>> => {
        try {
            const {projectId, databaseIds} = parsedInput;
            await assertDatabasesInOrgProject(projectId, databaseIds);
            const rows = await resolveLatestRestorable(projectId, databaseIds);

            const restorable = rows.filter((r) => r.restorable);
            const skipped = rows
                .filter((r) => !r.restorable)
                .map((r) => ({databaseId: r.databaseId, reason: r.reason ?? "no successful backup"}));

            if (restorable.length > 0) {
                await db.insert(drizzleDb.schemas.restoration).values(
                    restorable.map((r) => ({
                        databaseId: r.databaseId,
                        backupId: r.backupId!,
                        backupStorageId: r.backupStorageId!,
                        status: "waiting" as const,
                    })),
                );
            }

            return {
                success: true,
                value: {queued: restorable.length, skipped},
                actionSuccess: {
                    message: `Queued ${restorable.length} restore(s)${skipped.length ? `, ${skipped.length} skipped` : ""}.`,
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to queue restores.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });
