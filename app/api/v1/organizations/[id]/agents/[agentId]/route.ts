import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { requireOrg } from "@/lib/api-v1/services/organizations";
import { detachAgentFromOrganization } from "@/lib/api-v1/services/agents";

const log = logger.child({ module: "api/v1/organizations/[id]/agents/[agentId]" });

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = requireOrg(ctx, params?.id, "canManageAgents");
      if (!guard.ok) return guard.response;

      const agentId = params?.agentId;
      if (!agentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

      await detachAgentFromOrganization(agentId, guard.data.orgId);
      return NextResponse.json({ data: { organizationId: guard.data.orgId, agentId } });
    } catch (error) {
      log.error({ error }, "Error in DELETE org agent");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
