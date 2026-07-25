import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {
  deleteOrganization,
  getOrganizationById,
  isOrgSlugTaken,
  requireOrg,
  toSlug,
  updateOrganization,
} from "@/lib/api-v1/services/organizations";

const log = logger.child({ module: "api/v1/organizations/[id]" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id);
      if (!guard.ok) return guard.response;

      const org = await getOrganizationById(guard.data.orgId);
      if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

      return NextResponse.json({ data: org });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/organizations/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const UpdateOrganizationSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    logo: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const PATCH = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id, "canManageSettings");
      if (!guard.ok) return guard.response;

      const body = await parseJsonBody(req, UpdateOrganizationSchema);
      if (!body.ok) return body.response;

      const patch = { ...body.data };
      if (patch.name && !patch.slug) patch.slug = toSlug(patch.name);
      if (patch.slug) {
        const desired = toSlug(patch.slug);
        if (await isOrgSlugTaken(desired)) {
          const current = await getOrganizationById(guard.data.orgId);
          if (current?.slug !== desired) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
          }
        }
        patch.slug = desired;
      }

      const updated = await updateOrganization(guard.data.orgId, patch);
      return NextResponse.json({ data: updated });
    } catch (error) {
      log.error({ error }, "Error in PATCH /api/v1/organizations/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id, "canManageDangerZone");
      if (!guard.ok) return guard.response;

      if (!ctx.user.permissions.canDeleteOrganization && !guard.data.permissions.isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await deleteOrganization(guard.data.orgId);
      return NextResponse.json({ data: { id: guard.data.orgId } });
    } catch (error) {
      log.error({ error }, "Error in DELETE /api/v1/organizations/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
