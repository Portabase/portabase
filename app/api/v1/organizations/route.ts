import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {
  createOrganizationForUser,
  isOrgSlugTaken,
  listOrganizationsForUser,
  toSlug,
} from "@/lib/api-v1/services/organizations";

const log = logger.child({ module: "api/v1/organizations" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const data = await listOrganizationsForUser(ctx.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/organizations");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

const CreateOrganizationSchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z.string().min(1).optional(),
});

export const POST = withApiKey(async (req: Request, ctx: ApiKeyContext) => {
  try {
    if (!ctx.user.permissions.canCreateOwnOrganization) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await parseJsonBody(req, CreateOrganizationSchema);
    if (!body.ok) return body.response;

    const slug = toSlug(body.data.name, body.data.slug);
    if (await isOrgSlugTaken(slug)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const org = await createOrganizationForUser({
      userId: ctx.user.id,
      name: body.data.name,
      slug,
    });

    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) {
    log.error({ error }, "Error in POST /api/v1/organizations");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
