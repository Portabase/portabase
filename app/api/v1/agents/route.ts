import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { inArray, eq, and, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {createAgentService} from "@/features/agents/actions/agents.action";
import { ActionError } from "@/lib/safe-actions/actions";
import {getAccessibleAgentIds} from "@/lib/api-v1/services/agents";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";

const log = logger.child({ module: "api/v1/agents" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const agentIds = await getAccessibleAgentIds(ctx.user);

    if (agentIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const agents = await db.query.agent.findMany({
      where: and(
        inArray(drizzleDb.schemas.agent.id, agentIds),
        or(
          eq(drizzleDb.schemas.agent.isArchived, false),
          isNull(drizzleDb.schemas.agent.isArchived)
        )
      ),
    });

    return NextResponse.json({ data: agents });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/agents");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

const CreateAgentSchema = z.object({
  name: z.string().min(1, "name is required"),
  organizationId: z.string().uuid("organizationId must be a valid UUID").optional(),
});

export const POST = withApiKey(
    async (req: Request, ctx: ApiKeyContext) => {
      try {

        const body = await parseJsonBody(req, CreateAgentSchema);

        if (!body.ok) {
          return body.response;
        }

        const { name, organizationId } = body.data;

        const org = ctx.organizations.find(
            (org) => org.id === organizationId
        );

        if (
            organizationId &&
            (!org || !org.permissions.canManageAgents)
        ) {
          return NextResponse.json(
              { error: "Forbidden" },
              { status: 403 }
          );
        }

        const canCreateGlobalAgent =
            ctx.user.permissions.isAdmin || ctx.user.permissions.isSuperAdmin;

        if (!organizationId && !canCreateGlobalAgent) {
          return NextResponse.json(
              { error: "Forbidden" },
              { status: 403 }
          );
        }

        const createdAgent = await createAgentService({
          organizationId,
          data: {
            name,
            description: "",
          },
        });

        return NextResponse.json(
            { data: createdAgent },
            { status: 201 }
        );
      } catch (error: unknown) {
        if (error instanceof ActionError) {
          return NextResponse.json(
              { error: error.message },
              { status: 400 }
          );
        }

        log.error({error},
            "Error in POST /api/v1/agents"
        );

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);