import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {
  assignDatabaseToProject,
  getAccessibleDatabases,
  stripDatabaseConfigForApi,
} from "@/lib/api-v1/services/databases";
import { getAgent } from "@/lib/api-v1/services/agents";
import { requireOrg } from "@/lib/api-v1/services/organizations";
import { requireProjectAccess } from "@/lib/api-v1/services/projects";
import { DatabaseConfigFormSchema, type DatabaseConfigFormType } from "@/features/database/schemas/database-config.schema";
import { DatabaseConfigError, upsertDatabaseConfig } from "@/features/database/services/database-config.service";

const log = logger.child({ module: "api/v1/databases" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const databases = await getAccessibleDatabases(ctx.user);

    return NextResponse.json({
      data: databases,
    });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/databases");

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
});

const CreateDatabaseSchema = DatabaseConfigFormSchema.and(
    z.object({
      agentId: z.uuid(),
      projectId: z.uuid().optional(),
    })
);

export const POST = withApiKey(async (req: Request, ctx: ApiKeyContext) => {
  try {
    const body = await parseJsonBody(req, CreateDatabaseSchema);
    if (!body.ok) return body.response;
    const { agentId, projectId, ...data } = body.data;

    const agent = await getAgent(agentId, { includeOrganizations: true });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    if (agent.organizationId === null) {
      if (!ctx.user.permissions.isAdmin && !ctx.user.permissions.isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const agentOrg = await requireOrg(ctx, agent.organizationId, "canManageAgents");
      if (!agentOrg.ok) return agentOrg.response;
    }

    if (projectId) {
      const projectAccess = await requireProjectAccess(ctx, projectId);
      if (!projectAccess.ok) return projectAccess.response;
      const projectOrgId = projectAccess.data.project.organizationId;
      const projectOrg = await requireOrg(ctx, projectOrgId, "canManageSettings");
      if (!projectOrg.ok) return projectOrg.response;
      const agentInProjectOrg =
          agent.organizationId === projectOrgId ||
          (agent.organizations ?? []).some((organization) => organization.organizationId === projectOrgId);
      if (!agentInProjectOrg) {
        return NextResponse.json(
            { error: "Agent is not attached to the project's organization" },
            { status: 422 }
        );
      }
    }

    const created = await upsertDatabaseConfig({ agentId, data: data as DatabaseConfigFormType });
    if (projectId) await assignDatabaseToProject(created.id, projectId);

    const database = await db.query.database.findFirst({
      where: and(
          eq(drizzleDb.schemas.database.id, created.id),
          isNull(drizzleDb.schemas.database.deletedAt)
      ),
    });
    return NextResponse.json({ data: database ? stripDatabaseConfigForApi(database) : null }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ error }, "Error in POST /api/v1/databases");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
