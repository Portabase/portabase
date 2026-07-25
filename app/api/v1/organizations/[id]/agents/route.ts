import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireOrg } from "@/lib/api-v1/services/organizations";
import {
  attachAgentToOrganization,
  listOrganizationAgents,
} from "@/lib/api-v1/services/agents";

const log = logger.child({ module: "api/v1/organizations/[id]/agents" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = requireOrg(ctx, params?.id);
      if (!guard.ok) return guard.response;

      const data = await listOrganizationAgents(guard.data.orgId);
      return NextResponse.json({ data });
    } catch (error) {
      log.error({ error }, "Error in GET org agents");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const AttachAgentSchema = z.object({
  agentId: z.string().uuid("agentId must be a valid UUID"),
});

export const POST = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = requireOrg(ctx, params?.id, "canManageAgents");
      if (!guard.ok) return guard.response;

      if (!ctx.user.permissions.isAdmin && !ctx.user.permissions.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = await parseJsonBody(req, AttachAgentSchema);
      if (!body.ok) return body.response;

      const result = await attachAgentToOrganization(body.data.agentId, guard.data.orgId);

      if (result === "agent_not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (result === "not_global") {
        return NextResponse.json({ error: "Agent is not a global agent" }, { status: 422 });
      }
      if (result === "already_attached") {
        return NextResponse.json({ error: "Agent already attached" }, { status: 409 });
      }

      return NextResponse.json(
        { data: { organizationId: guard.data.orgId, agentId: body.data.agentId } },
        { status: 201 }
      );
    } catch (error) {
      log.error({ error }, "Error in POST org agents");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
