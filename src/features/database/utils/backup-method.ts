import type {BackupStorage} from "@/db/schema/14_storage-backup";
import {formatBytes} from "@/utils/text";

export type BackupEngine = "archive" | "restic" | "sync" | "copy";
export type WireMethod = "archive" | "snapshot" | "sync" | "copy";

export const METHOD_LABELS: Record<BackupEngine, string> = {
    archive: "Archive",
    restic: "Snapshots",
    sync: "Sync",
    copy: "Copy",
};

export const METHOD_DESCRIPTIONS: Record<BackupEngine, string> = {
    archive: "Each run uploads a full tar(.gz) archive of the directory. Size is the archive size.",
    restic:
        "Each run adds an incremental, deduplicated restic snapshot: only new and changed data is uploaded. " +
        "Size is the size of the files scanned; the repository grows by the new data plus restic metadata.",
    sync:
        "Each run mirrors the directory onto each storage: new and changed files are uploaded, files removed " +
        "from the source are deleted from the replica. Only the latest state is kept and it cannot be restored " +
        "from Portabase. Size is the replica size after the run.",
    copy:
        "Each run copies new and changed files onto each storage. Files removed from the source stay on the replica, " +
        "which only grows; a changed file is overwritten, there is no history. It cannot be restored from Portabase. " +
        "Size is the replica size after the run.",
};

export const REPLICA_ENGINES = ["sync", "copy"] as const;

export const isReplica = (engine: BackupEngine) => engine === "sync" || engine === "copy";

export const signedBytes = (bytes: number) => `${bytes < 0 ? "−" : "+"}${formatBytes(Math.abs(bytes))}`;

export function describeRun(storage: Pick<BackupStorage, "status" | "size" | "stats" | "engine">): string | null {
    const stats = storage.stats;
    if (storage.status !== "success" || !stats) return null;
    if ("filesNew" in stats) {
        const removed = stats.filesRemoved == null ? "" : `, ${stats.filesRemoved} removed`;
        return `${stats.filesNew} new, ${stats.filesChanged} changed, ${stats.filesUnmodified} unmodified${removed} file(s) · ${signedBytes(storage.size ?? 0)} new data`;
    }
    const delta =
        stats.sizeDelta == null
            ? ""
            : stats.sizeDelta === 0
              ? " · replica size unchanged"
              : ` · replica size ${signedBytes(stats.sizeDelta)}`;
    if (storage.engine === "copy") {
        return stats.filesTransferred === 0
            ? `Nothing new to copy${delta}`
            : `${stats.filesTransferred} file(s) copied (${formatBytes(storage.size ?? 0)})${delta}`;
    }
    if (stats.filesTransferred === 0 && stats.filesDeleted === 0) {
        return `Replica already matches the source: nothing transferred or deleted${delta}`;
    }
    return `${stats.filesTransferred} file(s) transferred (${formatBytes(storage.size ?? 0)}), ${stats.filesDeleted} deleted${delta}`;
}

export function engineFromWire(method: unknown): BackupEngine | undefined {
    switch (method) {
        case "archive":
            return "archive";
        case "snapshot":
            return "restic";
        case "sync":
            return "sync";
        case "copy":
            return "copy";
        default:
            return undefined;
    }
}

export function wireFromEngine(engine: BackupEngine): WireMethod {
    return engine === "restic" ? "snapshot" : engine;
}

export function resolveMethodConflict(stored: BackupEngine, announced: string | undefined): string | null {
    if (announced === undefined) return null;
    return engineFromWire(announced) === stored ? null : announced;
}

export function splitMethod(config: Record<string, unknown>): {config: Record<string, unknown>; method?: string} {
    const options = config.options;
    if (!options || typeof options !== "object" || Array.isArray(options) || !("method" in options)) {
        return {config};
    }
    const {method, ...rest} = options as Record<string, unknown>;
    const out: Record<string, unknown> = {...config};
    if (Object.keys(rest).length > 0) out.options = rest;
    else delete out.options;
    return {config: out, method: typeof method === "string" ? method : undefined};
}

export function withMethod(config: Record<string, unknown> | null | undefined, method: WireMethod): Record<string, unknown> {
    const base = config ?? {};
    const options = base.options && typeof base.options === "object" && !Array.isArray(base.options)
        ? (base.options as Record<string, unknown>)
        : {};
    return {...base, options: {...options, method}};
}
