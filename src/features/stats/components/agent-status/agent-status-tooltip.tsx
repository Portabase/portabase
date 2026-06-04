"use client";

import { HealthCheckGraph } from "@/features/database/health-grid";
import type { AgentWithChecks } from "@/features/stats/types";

type Props = {
  agent: AgentWithChecks;
};

export function AgentStatusTooltip({ agent }: Props) {
  const href = agent.organizationId
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
