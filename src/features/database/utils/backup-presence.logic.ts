export type CheckOutcome = "present" | "missing" | "error";

export type PresenceValue = "present" | "missing" | "unknown";

export function classifyCheckResult(result: {
    success: boolean;
    notFound?: boolean;
}): CheckOutcome {
    if (result.success) return "present";
    if (result.notFound) return "missing";
    return "error";
}

export type PresenceStateInput = {
    presence: PresenceValue;
};

export type PresenceUpdate = {
    presence: PresenceValue;
    lastCheckError: string | null;
    lastCheckedAt: Date;
};

export type FoldResult = {
    update: PresenceUpdate;
    flip: "to_missing" | "to_present" | null;
};


export function foldPresence(
    current: PresenceStateInput,
    outcome: CheckOutcome,
    now: Date,
    errorMessage?: string,
): FoldResult {
    if (outcome === "present") {
        return {
            update: {
                presence: "present",
                lastCheckError: null,
                lastCheckedAt: now,
            },
            flip: current.presence === "missing" ? "to_present" : null,
        };
    }

    if (outcome === "missing") {
        return {
            update: {
                presence: "missing",
                lastCheckError: null,
                lastCheckedAt: now,
            },
            flip: current.presence !== "missing" ? "to_missing" : null,
        };
    }

    return {
        update: {
            presence: current.presence,
            lastCheckError: errorMessage ?? "Unknown check error",
            lastCheckedAt: now,
        },
        flip: null,
    };
}

export type PresenceSummary = "missing" | "unverified" | "present" | "unknown";

export function summarizePresence(
    storages: { presence: string; lastCheckError: string | null; status: string }[],
): PresenceSummary {
    if (storages.length === 0) return "unknown";
    if (storages.some((s) => s.presence === "missing")) return "missing";
    if (storages.some((s) => s.lastCheckError != null)) return "unverified";
    const isPresent = (s: { presence: string; status: string }) =>
        s.presence === "present" || (s.status === "success" && s.presence === "unknown");
    if (storages.every(isPresent)) return "present";
    return "unknown";
}

export type StoragePresenceRow = {
    status: string;
    presence: string;
    lastCheckError: string | null;
};

export function isStorageAvailable(s: { status: string; presence: string }): boolean {
    return s.status === "success" && s.presence !== "missing";
}

export type StoragePresenceState = "present" | "missing" | "unverified" | "pending";

export function storagePresenceState(s: StoragePresenceRow): StoragePresenceState {
    if (s.status !== "success") return "pending";
    if (s.presence === "missing") return "missing";
    if (s.lastCheckError != null) return "unverified";
    return "present";
}
