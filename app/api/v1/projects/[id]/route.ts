import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireOrg } from "@/lib/api-v1/services/organizations";
import {
  archiveProject,
  isProjectSlugTaken,
  projectSlug,
  requireProjectAccess,
  updateProject,
} from "@/lib/api-v1/services/projects";

const log = logger.child({ module: "api/v1/projects/[id]" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireProjectAccess(ctx, params?.id);
      if (!guard.ok) return guard.response;
      return NextResponse.json({ data: guard.data.project });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/projects/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const UpdateProjectSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const PATCH = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireProjectAccess(ctx, params?.id);
      if (!guard.ok) return guard.response;

      const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
      if (!org.ok) return org.response;

      const body = await parseJsonBody(req, UpdateProjectSchema);
      if (!body.ok) return body.response;

      const patch = { ...body.data };
      if (patch.slug) {
        const desired = projectSlug(patch.slug);
        if (desired !== guard.data.project.slug && (await isProjectSlugTaken(desired))) {
          return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        patch.slug = desired;
      }

      const updated = await updateProject(guard.data.project.id, patch);
      return NextResponse.json({ data: updated });
    } catch (error) {
      log.error({ error }, "Error in PATCH /api/v1/projects/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireProjectAccess(ctx, params?.id);
      if (!guard.ok) return guard.response;

      const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
      if (!org.ok) return org.response;

      const archived = await archiveProject(guard.data.project.id);
      return NextResponse.json({ data: archived });
    } catch (error) {
      log.error({ error }, "Error in DELETE /api/v1/projects/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
