import { describe, it, expect } from "vitest";
import {
  classifyCheckResult,
  foldPresence,
  summarizePresence,
  MISSING_STRIKE_THRESHOLD,
} from "./backup-presence.logic";

const now = new Date("2026-08-16T05:00:00Z");

describe("classifyCheckResult", () => {
  it("present when success", () => {
    expect(classifyCheckResult({ success: true })).toBe("present");
  });
  it("missing when definitively not found", () => {
    expect(classifyCheckResult({ success: false, notFound: true })).toBe("missing");
  });
  it("error when failure is ambiguous", () => {
    expect(classifyCheckResult({ success: false, notFound: false })).toBe("error");
  });
  it("error when failure with no notFound flag", () => {
    expect(classifyCheckResult({ success: false })).toBe("error");
  });
});

describe("foldPresence", () => {
  const present = { presence: "present" as const, missingStrikeCount: 0, missingSince: null };

  it("present result from present state: no flip, resets error/strike", () => {
    const r = foldPresence(present, "present", now, "old");
    expect(r.flip).toBeNull();
    expect(r.update.presence).toBe("present");
    expect(r.update.missingStrikeCount).toBe(0);
    expect(r.update.lastCheckError).toBeNull();
    expect(r.update.lastCheckedAt).toBe(now);
  });

  it("present result from missing state: flips to_present and clears missingSince", () => {
    const missing = { presence: "missing" as const, missingStrikeCount: 3, missingSince: now };
    const r = foldPresence(missing, "present", now);
    expect(r.flip).toBe("to_present");
    expect(r.update.presence).toBe("present");
    expect(r.update.missingSince).toBeNull();
  });

  it("first and second missing do not flip", () => {
    const r1 = foldPresence(present, "missing", now);
    expect(r1.flip).toBeNull();
    expect(r1.update.presence).toBe("present");
    expect(r1.update.missingStrikeCount).toBe(1);

    const r2 = foldPresence(
      { presence: "present", missingStrikeCount: 1, missingSince: null },
      "missing",
      now,
    );
    expect(r2.flip).toBeNull();
    expect(r2.update.missingStrikeCount).toBe(2);
  });

  it("third consecutive missing flips to_missing and sets missingSince", () => {
    const r = foldPresence(
      { presence: "present", missingStrikeCount: MISSING_STRIKE_THRESHOLD - 1, missingSince: null },
      "missing",
      now,
    );
    expect(r.flip).toBe("to_missing");
    expect(r.update.presence).toBe("missing");
    expect(r.update.missingSince).toBe(now);
  });

  it("missing while already missing: no second flip, keeps missingSince", () => {
    const since = new Date("2026-08-16T00:00:00Z");
    const r = foldPresence(
      { presence: "missing", missingStrikeCount: 5, missingSince: since },
      "missing",
      now,
    );
    expect(r.flip).toBeNull();
    expect(r.update.presence).toBe("missing");
    expect(r.update.missingSince).toBe(since);
  });

  it("ambiguous error never changes presence or strike, records error", () => {
    const r = foldPresence(
      { presence: "present", missingStrikeCount: 2, missingSince: null },
      "error",
      now,
      "timeout",
    );
    expect(r.flip).toBeNull();
    expect(r.update.presence).toBe("present");
    expect(r.update.missingStrikeCount).toBe(2);
    expect(r.update.lastCheckError).toBe("timeout");
    expect(r.update.lastCheckedAt).toBe(now);
  });
});

describe("summarizePresence", () => {
  it("unknown when no storages", () => {
    expect(summarizePresence([])).toBe("unknown");
  });
  it("missing wins over everything", () => {
    expect(
      summarizePresence([
        { presence: "present", lastCheckError: null },
        { presence: "missing", lastCheckError: null },
      ]),
    ).toBe("missing");
  });
  it("unverified when an error but nothing missing", () => {
    expect(
      summarizePresence([
        { presence: "present", lastCheckError: null },
        { presence: "present", lastCheckError: "timeout" },
      ]),
    ).toBe("unverified");
  });
  it("present when all present and no errors", () => {
    expect(summarizePresence([{ presence: "present", lastCheckError: null }])).toBe("present");
  });
  it("unknown fallback otherwise", () => {
    expect(summarizePresence([{ presence: "unknown", lastCheckError: null }])).toBe("unknown");
  });
});
