export type CheckOutcome = "present" | "missing" | "error";

export type PresenceValue = "present" | "missing" | "unknown";

export const MISSING_STRIKE_THRESHOLD = 3;

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
  missingStrikeCount: number;
  missingSince: Date | null;
};

export type PresenceUpdate = {
  presence: PresenceValue;
  missingStrikeCount: number;
  missingSince: Date | null;
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
    const flip = current.presence === "missing" ? "to_present" : null;
    return {
      update: {
        presence: "present",
        missingStrikeCount: 0,
        missingSince: null,
        lastCheckError: null,
        lastCheckedAt: now,
      },
      flip,
    };
  }

  if (outcome === "missing") {
    const nextStrike = current.missingStrikeCount + 1;
    const willFlip =
      current.presence !== "missing" && nextStrike >= MISSING_STRIKE_THRESHOLD;
    return {
      update: {
        presence: willFlip ? "missing" : current.presence,
        missingStrikeCount: nextStrike,
        missingSince: willFlip ? now : current.missingSince,
        lastCheckError: null,
        lastCheckedAt: now,
      },
      flip: willFlip ? "to_missing" : null,
    };
  }

  return {
    update: {
      presence: current.presence,
      missingStrikeCount: current.missingStrikeCount,
      missingSince: current.missingSince,
      lastCheckError: errorMessage ?? "Unknown check error",
      lastCheckedAt: now,
    },
    flip: null,
  };
}

export type PresenceSummary = "missing" | "unverified" | "present" | "unknown";

export function summarizePresence(
  storages: { presence: string; lastCheckError: string | null }[],
): PresenceSummary {
  if (storages.length === 0) return "unknown";
  if (storages.some((s) => s.presence === "missing")) return "missing";
  if (storages.some((s) => s.lastCheckError != null)) return "unverified";
  if (storages.every((s) => s.presence === "present")) return "present";
  return "unknown";
}
