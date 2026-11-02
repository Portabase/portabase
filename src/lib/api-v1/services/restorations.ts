import {and, eq, inArray, isNull} from "drizzle-orm";
import {NextResponse} from "next/server";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {isReplica} from "@/features/database/utils/backup-method";
import {isUuid} from "@/lib/api-v1/validation/uuid";

type CheckResult = { ok: true } | { ok: false; response: NextResponse };

function reject(error: string, status: number): CheckResult {
    return {ok: false, response: NextResponse.json({error}, {status})};
}

export async function hasActiveRestoration(databaseId: string): Promise<boolean> {
    const active = await db.query.restoration.findFirst({
        where: and(
            eq(drizzleDb.schemas.restoration.databaseId, databaseId),
            inArray(drizzleDb.schemas.restoration.status, ["waiting", "ongoing"])
        ),
        columns: {id: true},
    });
    return Boolean(active);
}

export async function checkRestorableBackup(
    databaseId: string,
    backupId: string,
    backupStorageId: string | null
): Promise<CheckResult> {
    const backup = await db.query.backup.findFirst({
        where: and(
            eq(drizzleDb.schemas.backup.id, backupId),
            eq(drizzleDb.schemas.backup.databaseId, databaseId),
            isNull(drizzleDb.schemas.backup.deletedAt)
        ),
        columns: {id: true},
    });
    if (!backup) return reject("Backup not found for this database", 404);

    const backupStorage = backupStorageId
        ? await db.query.backupStorage.findFirst({
            where: and(
                eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
                eq(drizzleDb.schemas.backupStorage.backupId, backupId),
                isNull(drizzleDb.schemas.backupStorage.deletedAt)
            ),
        })
        : undefined;
    if (!backupStorage) return reject("Backup storage not found", 404);
    if (backupStorage.status !== "success") return reject("Backup storage is not in a successful state", 422);
    if (backupStorage.presence === "missing") return reject("This backup file is missing and cannot be restored", 409);
    if (isReplica(backupStorage.engine)) return reject("A replica cannot be restored.", 409);

    return {ok: true};
}

export async function findDatabaseRestoration(databaseId: string, restorationId: string | undefined) {
    if (!isUuid(restorationId)) return undefined;
    return db.query.restoration.findFirst({
        where: and(
            eq(drizzleDb.schemas.restoration.id, restorationId),
            eq(drizzleDb.schemas.restoration.databaseId, databaseId),
            isNull(drizzleDb.schemas.restoration.deletedAt)
        ),
    });
}
