import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireOrg } from "@/lib/api-v1/services/organizations";
import {
  createProject,
  isProjectSlugTaken,
  listProjects,
  projectSlug,
} from "@/lib/api-v1/services/projects";

const log = logger.child({ module: "api/v1/organizations/[id]/projects" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id);
      if (!guard.ok) return guard.response;

      const data = await listProjects(guard.data.orgId);
      return NextResponse.json({ data });
    } catch (error) {
      log.error({ error }, "Error in GET org projects");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const CreateProjectSchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1).optional(),
});

export const POST = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id, "canManageSettings");
      if (!guard.ok) return guard.response;

      const body = await parseJsonBody(req, CreateProjectSchema);
      if (!body.ok) return body.response;

      const slug = projectSlug(body.data.name, body.data.slug);
      if (await isProjectSlugTaken(slug)) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }

      const project = await createProject({
        organizationId: guard.data.orgId,
        name: body.data.name,
        slug,
      });

      return NextResponse.json({ data: project }, { status: 201 });
    } catch (error) {
      log.error({ error }, "Error in POST org projects");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
