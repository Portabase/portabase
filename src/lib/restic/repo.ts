import {spawn} from "node:child_process";
import {hkdfSync} from "node:crypto";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

import {maxConnections} from "@/features/channel/components/storages/rclone/config";
import type {RcloneConfig} from "@/features/channel/components/storages/rclone/types";

export type ResticRun = { code: number; stdout: string; stderr: string };

export type ResticRepo = {
    /** `<remote>:<base>/<folder>/restic/<generatedId>` */
    path: string;
    run: (args: string[]) => Promise<ResticRun>;
    rclone: (args: string[]) => Promise<ResticRun>;
};

const RETRY_LOCK = "1m";

/**
 * hex(HKDF-SHA256(master key, salt = "", info = "portabase/restic/v1/<generatedId>", 32)).
 * The agent derives the same value (services/restic/password.rs).
 */
export function resticPassword(masterKey: Buffer, generatedId: string): string {
    return Buffer.from(
        hkdfSync("sha256", masterKey, Buffer.alloc(0), `portabase/restic/v1/${generatedId}`, 32),
    ).toString("hex");
}

/** `<remote>:<base>/<rel>`, collapsing an empty base (P1 `remote_target`). */
export function remotePath(rclone: RcloneConfig, rel: string): string {
    const base = (rclone.remotePath ?? "").trim().replace(/^\/+|\/+$/g, "");
    return base ? `${rclone.remoteName}:${base}/${rel}` : `${rclone.remoteName}:${rel}`;
}

export function resticRepoPath(rclone: RcloneConfig, folderName: string, generatedId: string): string {
    const folder = folderName.trim().replace(/^\/+|\/+$/g, "") || "backups";
    return remotePath(rclone, `${folder}/restic/${generatedId}`);
}

export function capture(bin: string, args: string[], env: NodeJS.ProcessEnv): Promise<ResticRun> {
    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, {env, stdio: ["ignore", "pipe", "pipe"]});
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (c: Buffer) => {
            stdout += c.toString();
        });
        child.stderr.on("data", (c: Buffer) => {
            stderr += c.toString();
        });
        child.on("error", (e: NodeJS.ErrnoException) =>
            reject(e.code === "ENOENT" ? new Error(`${bin} binary not found`) : e),
        );
        child.on("close", (code) => resolve({code: code ?? -1, stdout, stderr: stderr.trim()}));
    });
}

function failure(op: string, run: ResticRun): Error {
    switch (run.code) {
        case 10:
            return new Error(`restic ${op}: repository does not exist`);
        case 11:
            return new Error(`restic ${op}: repository is locked, try again later`);
        case 12:
            return new Error(`restic ${op}: wrong repository password (did the master key change?)`);
        default:
            return new Error(`restic ${op} failed (exit ${run.code}): ${run.stderr.split("\n").slice(-5).join(" | ")}`);
    }
}

export async function withResticRepo<T>(
    rclone: RcloneConfig,
    folderName: string,
    generatedId: string,
    masterKey: Buffer,
    fn: (repo: ResticRepo) => Promise<T>,
): Promise<T> {
    const dir = await mkdtemp(path.join(tmpdir(), "portabase-restic-"));
    try {
        const config = path.join(dir, "rclone.conf");
        await writeFile(config, rclone.configText, {mode: 0o600});
        const repoPath = resticRepoPath(rclone, folderName, generatedId);
        const env = {
            ...process.env,
            RESTIC_REPOSITORY: `rclone:${repoPath}`,
            RESTIC_PASSWORD: resticPassword(masterKey, generatedId),
            RCLONE_CONFIG: config,
            // ponytail: lives as long as the container; prune re-downloads trees after a restart.
            RESTIC_CACHE_DIR: path.join(tmpdir(), "portabase-restic-cache"),
        };
        const connections = maxConnections(rclone.configText);
        const limit = connections ? ["-o", `rclone.connections=${connections}`] : [];
        return await fn({
            path: repoPath,
            run: (args) => capture("restic", [...args, "--retry-lock", RETRY_LOCK, ...limit], env),
            rclone: (args) => capture("rclone", ["--config", config, ...args], process.env),
        });
    } finally {
        await rm(dir, {recursive: true, force: true});
    }
}

/**
 * A full restic snapshot id. Snapshot ids reach restic as positional arguments and
 * come from the agent (`backup_storage.path`): anything else could be parsed as a flag
 * (e.g. `--password-command=<shell>`).
 */
export function isSnapshotId(id: string): boolean {
    return /^[0-9a-f]{64}$/.test(id);
}

export async function forget(repo: ResticRepo, snapshotId: string): Promise<"forgotten" | "repository-missing"> {
    if (!isSnapshotId(snapshotId)) throw new Error("restic forget: invalid snapshot id");
    const run = await repo.run(["forget", snapshotId]);
    if (run.code === 10) return "repository-missing";
    if (run.code !== 0) throw failure("forget", run);
    return "forgotten";
}

export async function prune(repo: ResticRepo): Promise<void> {
    const unlock = await repo.run(["unlock"]);
    if (unlock.code === 10) return;
    if (unlock.code !== 0) throw failure("unlock", unlock);
    const run = await repo.run(["prune"]);
    if (run.code !== 0) throw failure("prune", run);
}

/**
 * Removes the whole repository. Existence is checked with restic because
 * `rclone purge` exit codes for a missing path differ between backends.
 */
export async function purge(repo: ResticRepo): Promise<void> {
    const cat = await repo.run(["cat", "config"]);
    if (cat.code === 10) return;
    if (cat.code !== 0) throw failure("cat config", cat);
    const run = await repo.rclone(["purge", repo.path]);
    if (run.code !== 0) throw new Error(`rclone purge failed (exit ${run.code}): ${run.stderr}`);
}

export type SnapshotInfo = {id: string; tags?: string[] | null};

/** `<id>` of every `bs:<id>` tag (the agent tags each snapshot with its backup_storage row). */
export function snapshotRowIds(snapshots: SnapshotInfo[]): string[] {
    const ids = new Set<string>();
    for (const s of snapshots) {
        for (const tag of s.tags ?? []) {
            if (tag.startsWith("bs:") && tag.length > 3) ids.add(tag.slice(3));
        }
    }
    return [...ids];
}

/**
 * Snapshots kept by an append-only local repository for runs that failed (unreadable
 * files): their `bs:<id>` tag names a failed row. Pending rows (backup in flight) and
 * successful rows are never selected.
 */
export function orphanSnapshotIds(snapshots: SnapshotInfo[], failedRowIds: Set<string>): string[] {
    return snapshots
        .filter((s) => (s.tags ?? []).some((t) => t.startsWith("bs:") && failedRowIds.has(t.slice(3))))
        .map((s) => s.id);
}

/** `restic snapshots --json`; a missing repository has none. */
export async function listSnapshots(repo: ResticRepo): Promise<SnapshotInfo[]> {
    const run = await repo.run(["snapshots", "--json"]);
    if (run.code === 10) return [];
    if (run.code !== 0) throw failure("snapshots", run);
    return JSON.parse(run.stdout || "[]") as SnapshotInfo[];
}

export async function forgetMany(repo: ResticRepo, snapshotIds: string[]): Promise<void> {
    if (snapshotIds.length === 0) return;
    if (!snapshotIds.every(isSnapshotId)) throw new Error("restic forget: invalid snapshot id");
    const run = await repo.run(["forget", ...snapshotIds]);
    if (run.code !== 0) throw failure("forget", run);
}
