import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {
  requireDatabaseAccess,
  requireAccessibleDatabase,
  assignDatabaseToProject,
  detachDatabaseFromProject,
} from "@/lib/api-v1/services/databases";
import { requireProjectAccess } from "@/lib/api-v1/services/projects";

const log = logger.child({ module: "api/v1/databases/[id]" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;

        const database = await db.query.database.findFirst({
          where: and(
              eq(drizzleDb.schemas.database.id, id),
              isNull(drizzleDb.schemas.database.deletedAt)
          ),
        });

        if (!database) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ data: database });
      } catch (error) {
        log.error({ error }, "Error in GET /api/v1/databases/[id]");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);


const UpdateDatabaseSchema = z.object({
  projectId: z.uuid().nullable(),
});

export const PATCH = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {

        const guard = await requireAccessibleDatabase(params, ctx.user);
        if (!guard.ok) return guard.response;

        const body = await parseJsonBody(req, UpdateDatabaseSchema);
        if (!body.ok) return body.response;

        if (body.data.projectId === null) {
          await detachDatabaseFromProject(guard.data.id);
        } else {
          const projectAccess = await requireProjectAccess(ctx, body.data.projectId);
          if (!projectAccess.ok) return projectAccess.response;

          const result = await assignDatabaseToProject(guard.data.id, body.data.projectId);
          if (!result.ok && result.reason === "project_not_found") {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
          }
          if (!result.ok && result.reason === "agent_not_in_org") {
            return NextResponse.json(
                { error: "Agent is not attached to the project's organization" },
                { status: 422 }
            );
          }
        }

        const updated = await db.query.database.findFirst({
          where: and(
              eq(drizzleDb.schemas.database.id, guard.data.id),
              isNull(drizzleDb.schemas.database.deletedAt)
          ),
        });
        return NextResponse.json({ data: updated });
      } catch (error) {
        log.error({ error }, "Error in PATCH /api/v1/databases/[id]");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }
);