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
): number | null {
  if (lastContact === null || lastContact === undefined) return null;

  const date = lastContact instanceof Date ? lastContact : new Date(lastContact);
  if (Number.isNaN(date.getTime())) return null;

  return Date.now() - date.getTime();
}

export function getAgentStatus(
  lastContact: Date | string | null | undefined,
  thresholds: StatusThresholds,
): AgentStatus {
  const elapsed = msSinceLastContact(lastContact);
  if (elapsed === null) return "offline";

  if (elapsed < thresholds.online) return "online";
  if (elapsed <= thresholds.degraded) return "degraded";
  return "offline";
}

export function isAgentOnline(
  lastContact: Date | string | null | undefined,
): boolean {
  return getAgentStatus(lastContact, LIVE_THRESHOLDS) !== "offline";
}
