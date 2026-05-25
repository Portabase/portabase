import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleAgentIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { withUpdatedAt } from "@/db/utils";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/agents/[id]" });

async function resolveAgentAccess(id: string, userId: string) {
  const accessibleAgentIds = await getAccessibleAgentIds(userId);
  if (accessibleAgentIds.includes(id)) return "ok";

  const exists = await db.query.agent.findFirst({
    where: and(
      eq(drizzleDb.schemas.agent.id, id),
      or(
        eq(drizzleDb.schemas.agent.isArchived, false),
        isNull(drizzleDb.schemas.agent.isArchived)
      )
    ),
    columns: { id: true },
  });

  return exists ? "forbidden" : "not_found";
}

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const access = await resolveAgentAccess(id, ctx.userId);
      if (access === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (access === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });

      const agent = await db.query.agent.findFirst({
        where: and(
          eq(drizzleDb.schemas.agent.id, id),
          or(
            eq(drizzleDb.schemas.agent.isArchived, false),
            isNull(drizzleDb.schemas.agent.isArchived)
          )
        ),
        with: { databases: true },
      });

      if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: agent });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/agents/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const access = await resolveAgentAccess(id, ctx.userId);
      if (access === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (access === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });

      await db
        .update(drizzleDb.schemas.agent)
        .set(withUpdatedAt({ isArchived: true, slug: uuidv4(), deletedAt: new Date() }))
        .where(eq(drizzleDb.schemas.agent.id, id));

      return new Response(null, { status: 204 });
    } catch (error) {
      log.error({ error }, "Error in DELETE /api/v1/agents/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
