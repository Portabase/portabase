import {and, asc, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";
import {getBackupFolderName} from "@/utils/file-prefix";
import {logger} from "@/lib/logger";

const log = logger.child({module: "features/storages/backup-manifest"});

const MANIFEST_FILE_NAME = "manifest.json";
const MANIFEST_VERSION = 1;

type BackupManifestEntry = {
    backupId: string;
    createdAt: string;
    path: string;
    size: number | null;
    checksum: string | null;
    imported: boolean;
    migrated: boolean;
};

type BackupManifestDatabase = {
    id: string;
    generatedId: string | null;
    name: string;
    dbms: string;
    backups: BackupManifestEntry[];
};

type BackupManifest = {
    version: number;
    generatedAt: string;
    project: { id: string; slug: string; name: string };
    databases: BackupManifestDatabase[];
};

function getManifestPath(projectSlug: string) {
    return `${getBackupFolderName()}/${projectSlug}/${MANIFEST_FILE_NAME}`;
}

/**
 * Builds the manifest of every live, successfully stored backup of a project
 * on one storage channel. The database is the source of truth: the manifest
 * is always fully regenerated, never patched.
 */
async function buildBackupManifest(projectId: string, storageChannelId: string): Promise<BackupManifest | null> {
    const project = await db.query.project.findFirst({
        where: eq(drizzleDb.schemas.project.id, projectId),
    });

    if (!project) return null;

    const {backupStorage, backup, database} = drizzleDb.schemas;

    const rows = await db
        .select({
            databaseId: database.id,
            generatedId: database.agentDatabaseId,
            databaseName: database.name,
            dbms: database.dbms,
            backupId: backup.id,
            createdAt: backup.createdAt,
            imported: backup.imported,
            migrated: backup.migrated,
            path: backupStorage.path,
            size: backupStorage.size,
            checksum: backupStorage.checksum,
        })
        .from(backupStorage)
        .innerJoin(backup, eq(backupStorage.backupId, backup.id))
        .innerJoin(database, eq(backup.databaseId, database.id))
        .where(and(
            eq(database.projectId, projectId),
            eq(backupStorage.storageChannelId, storageChannelId),
            eq(backupStorage.status, "success"),
            isNull(backupStorage.deletedAt),
            isNull(backup.deletedAt),
            isNull(database.deletedAt),
        ))
        .orderBy(asc(database.name), asc(backup.createdAt));

    const databases = new Map<string, BackupManifestDatabase>();

    for (const row of rows) {
        if (!row.path) continue;

        let entry = databases.get(row.databaseId);
        if (!entry) {
            entry = {
                id: row.databaseId,
                generatedId: row.generatedId,
                name: row.databaseName,
                dbms: row.dbms,
                backups: [],
            };
            databases.set(row.databaseId, entry);
        }

        entry.backups.push({
            backupId: row.backupId,
            createdAt: row.createdAt.toISOString(),
            path: row.path,
            size: row.size,
            checksum: row.checksum,
            imported: row.imported ?? false,
            migrated: row.migrated ?? false,
        });
    }

    return {
        version: MANIFEST_VERSION,
        generatedAt: new Date().toISOString(),
        project: {id: project.id, slug: project.slug, name: project.name},
        databases: [...databases.values()],
    };
}

async function writeBackupManifest(projectId: string, storageChannelId: string) {
    const manifest = await buildBackupManifest(projectId, storageChannelId);
    if (!manifest) return;

    const path = getManifestPath(manifest.project.slug);
    const result = await dispatchStorage(
        {
            action: "upload",
            data: {
                path,
                file: Buffer.from(JSON.stringify(manifest, null, 2)),
                contentType: "application/json",
                overwrite: true,
            },
        },
        undefined,
        storageChannelId,
    );

    if (!result.success) {
        log.error({projectId, storageChannelId, path, cause: result.error}, "Failed to write backup manifest");
    }
}

// Rebuilds are serialized per (project, channel) and coalesced: while one is
// running, any number of new requests collapse into a single follow-up run.
const running = new Map<string, Promise<void>>();
const dirty = new Set<string>();

async function runCoalesced(key: string, projectId: string, storageChannelId: string): Promise<void> {
    try {
        do {
            dirty.delete(key);
            try {
                await writeBackupManifest(projectId, storageChannelId);
            } catch (error) {
                log.error({projectId, storageChannelId, error}, "Backup manifest rebuild threw");
            }
        } while (dirty.has(key));
    } finally {
        running.delete(key);
    }
}

/**
 * Schedules a manifest rebuild. Never throws and never blocks the caller:
 * the manifest is a convenience for disaster recovery and must not make a
 * backup or a deletion fail.
 */
export function refreshBackupManifest(projectId: string | null | undefined, storageChannelId: string): void {
    if (!projectId) return;

    const key = `${projectId}:${storageChannelId}`;

    if (running.has(key)) {
        dirty.add(key);
        return;
    }

    running.set(key, runCoalesced(key, projectId, storageChannelId));
}

/** Rebuilds the manifests touched by a backup, on every channel it was stored on. */
export async function refreshBackupManifestsForBackup(backupId: string): Promise<void> {
    try {
        const backup = await db.query.backup.findFirst({
            where: eq(drizzleDb.schemas.backup.id, backupId),
            with: {database: true, storages: true},
        });

        if (!backup?.database?.projectId) return;

        const channelIds = new Set(backup.storages.map(s => s.storageChannelId));
        for (const channelId of channelIds) {
            refreshBackupManifest(backup.database.projectId, channelId);
        }
    } catch (error) {
        log.error({backupId, error}, "Failed to schedule backup manifest refresh");
    }
}
