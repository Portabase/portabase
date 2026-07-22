"use client";

import { HealthCheckGraph } from "@/features/database/components/health-grid";
import type { AgentLinkAccess, AgentWithChecks } from "@/features/stats/types";

type Props = {
  agent: AgentWithChecks;
  access?: AgentLinkAccess;
};

function getAgentHref(
  agent: AgentWithChecks,
  access?: AgentLinkAccess,
): string | undefined {
  if (!access) return undefined;

  if (agent.organizationId) {
    const isActiveOrg = agent.organizationId === access.activeOrganizationId;
    return isActiveOrg && access.canManageOrgAgents
      ? `/dashboard/settings/agents/${agent.id}`
      : undefined;
  }

  return access.isInstanceAdmin ? `/dashboard/agents/${agent.id}` : undefined;
}

export function AgentStatusTooltip({ agent, access }: Props) {
  return (
    <HealthCheckGraph
      logs={agent.recentChecks}
      type="compact"
      title={agent.name}
      href={getAgentHref(agent, access)}
    />
  );
}
