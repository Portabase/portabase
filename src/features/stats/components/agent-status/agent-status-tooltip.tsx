"use client";

import { HealthCheckGraph } from "@/features/database/components/health-grid";
import type { AgentWithChecks } from "@/features/stats/types";

type Props = {
  agent: AgentWithChecks;
  isOrganizationView?: boolean;
  canOpenAgent?: boolean;
};

export function AgentStatusTooltip({
  agent,
  isOrganizationView,
  canOpenAgent,
}: Props) {

  const href = !canOpenAgent
    ? undefined
    : isOrganizationView
      ? `/dashboard/settings/agents/${agent.id}`
      : `/dashboard/agents/${agent.id}`;

  return (
    <HealthCheckGraph
      logs={agent.recentChecks}
      type="compact"
      title={agent.name}
      href={href}
    />
  );
}
