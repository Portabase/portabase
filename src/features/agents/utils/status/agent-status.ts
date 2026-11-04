export type AgentStatus = "online" | "degraded" | "offline";

export type StatusThresholds = {
  online: number;
  degraded: number;
};

export const LIVE_THRESHOLDS: StatusThresholds = {
  online: 55_000,
  degraded: 60_000,
};

export const DASHBOARD_THRESHOLDS: StatusThresholds = {
  online: 600_000,
  degraded: 1_800_000,
};

export function msSinceLastContact(
  lastContact: Date | string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (lastContact === null || lastContact === undefined) return null;

  const date = lastContact instanceof Date ? lastContact : new Date(lastContact);
  if (Number.isNaN(date.getTime())) return null;

  return now - date.getTime();
}

export function getAgentStatus(
  lastContact: Date | string | null | undefined,
  thresholds: StatusThresholds,
  now: number = Date.now(),
): AgentStatus {
  const elapsed = msSinceLastContact(lastContact, now);
  if (elapsed === null) return "offline";

  if (elapsed < thresholds.online) return "online";
  if (elapsed <= thresholds.degraded) return "degraded";
  return "offline";
}

export function isAgentOnline(
  lastContact: Date | string | null | undefined,
  now: number = Date.now(),
): boolean {
  return getAgentStatus(lastContact, LIVE_THRESHOLDS, now) !== "offline";
}

export type Liveness = "online" | "offline" | "never";

export function getLiveness(
  lastContact: Date | string | null | undefined,
  now: number = Date.now(),
): Liveness {
  const elapsed = msSinceLastContact(lastContact, now);
  if (elapsed === null) return "never";
  return elapsed <= LIVE_THRESHOLDS.degraded ? "online" : "offline";
}
