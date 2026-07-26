import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import {
  getOrganizationById,
  organizationHasProjects,
  requireOrg,
} from "@/lib/api-v1/services/organizations";
import { deleteOrganizationService } from "@/features/organizations/actions/organization.action";
import { DEFAULT_ORGANIZATION_SLUG } from "@/features/organizations/constants";

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

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireOrg(ctx, params?.id, "canManageDangerZone");
      if (!guard.ok) return guard.response;

      if (!ctx.user.permissions.canDeleteOrganization && !guard.data.permissions.isOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const org = await getOrganizationById(guard.data.orgId);
      if (org?.slug === DEFAULT_ORGANIZATION_SLUG) {
        return NextResponse.json(
          { error: "The default organization cannot be deleted." },
          { status: 403 }
        );
      }

      if (await organizationHasProjects(guard.data.orgId)) {
        return NextResponse.json(
          { error: "Your organization has some projects associated with it. Please delete them before deleting the organization." },
          { status: 409 }
        );
      }

      await deleteOrganizationService(guard.data.orgId);
      return NextResponse.json({ data: { id: guard.data.orgId } });
    } catch (error) {
      log.error({ error }, "Error in DELETE /api/v1/organizations/[id]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
