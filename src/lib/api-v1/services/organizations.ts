import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { OrganizationPermissions } from "@/lib/acl/organization-acl";
import { slugify } from "@/utils/slugify";

type GuardResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Ensures the caller is a member of `orgId`. When `capability` is given,
 * also checks that per-org permission (e.g. "canManageSettings").
 */
export function requireOrg(
  ctx: ApiKeyContext,
  orgId: string | undefined,
  capability?: keyof OrganizationPermissions
): GuardResult<{ orgId: string; permissions: OrganizationPermissions }> {
  if (!orgId) return { ok: false, response: jsonError("Not found", 404) };

  const membership = ctx.organizations.find((o) => o.id === orgId);
  if (!membership) return { ok: false, response: jsonError("Not found", 404) };

  if (capability && !membership.permissions[capability]) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return {
    ok: true,
    data: { orgId, permissions: membership.permissions },
  };
}

export async function isOrgSlugTaken(slug: string): Promise<boolean> {
  const existing = await db.query.organization.findFirst({
    where: and(
      eq(drizzleDb.schemas.organization.slug, slug),
      isNull(drizzleDb.schemas.organization.deletedAt)
    ),
    columns: { id: true },
  });
  return Boolean(existing);
}

export function toSlug(name: string, provided?: string): string {
  return slugify(provided && provided.length > 0 ? provided : name);
}
