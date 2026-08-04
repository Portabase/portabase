import {DatabaseWith, RetentionPolicy} from "@/db/schema/07_database";
import {StoragePolicy} from "@/db/schema/13_storage-policy";
import {AlertPolicy} from "@/db/schema/10_alert-policy";


export function resolveStoragePolicies(db: DatabaseWith): StoragePolicy[] {
    const own = db.storagePolicies ?? [];
    if (own.length > 0) return own;
    return db.project?.storagePolicies ?? [];
}

export function resolveAlertPolicies(db: DatabaseWith): AlertPolicy[] {
    const own = db.alertPolicies ?? [];
    if (own.length > 0) return own;
    return db.project?.alertPolicies ?? [];
}

export function resolveRetentionPolicy(db: DatabaseWith): RetentionPolicy | null {
    return db.retentionPolicy ?? db.project?.retentionPolicy ?? null;
}

export function resolveBackupCron(db: DatabaseWith): string | null {
    return db.backupPolicy ?? db.project?.backupPolicy ?? null;
}
