export type AgentStatus = "online" | "degraded" | "offline";

export type StatusThresholds = {
  /** Strictement en dessous => "online" */
  online: number;
  /** Jusqu'à cette valeur incluse => "degraded", au-delà => "offline" */
  degraded: number;
};

/** Pouls live à la seconde : utilisé par ConnectionIndicator et le gate de suppression. */
export const LIVE_THRESHOLDS: StatusThresholds = {
  online: 55_000,
  degraded: 60_000,
};

/** Tolérance dashboard, documentée à l'utilisateur dans agent-status.info.tsx. */
export const DASHBOARD_THRESHOLDS: StatusThresholds = {
  online: 600_000,
  degraded: 1_800_000,
};

/**
 * Millisecondes écoulées depuis le dernier contact.
 * Renvoie null si la valeur est absente ou n'est pas une date valide.
 */
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

/**
 * Gate de suppression : true tant que l'agent donne signe de vie sous 60s.
 * Un agent sans dernier contact est considéré offline.
 */
export function isAgentOnline(
  lastContact: Date | string | null | undefined,
): boolean {
  return getAgentStatus(lastContact, LIVE_THRESHOLDS) !== "offline";
}
