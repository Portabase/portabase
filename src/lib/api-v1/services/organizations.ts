import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import {NextResponse} from "next/server";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {OrganizationPermissions} from "@/lib/acl/organization-acl";
import {slugify} from "@/utils/slugify";

type GuardResult<T> =
    | { ok: true; data: T }
    | { ok: false; response: NextResponse };

function jsonError(message: string, status: number) {
    return NextResponse.json({error: message}, {status});
}


export async function requireOrg(
    ctx: ApiKeyContext,
    orgId: string | undefined,
    capability?: keyof OrganizationPermissions
): Promise<GuardResult<{ orgId: string; permissions: OrganizationPermissions }>> {
    if (!orgId) return {ok: false, response: jsonError("Not found", 404)};

    const membership = ctx.organizations.find((o) => o.id === orgId);
    if (!membership) return {ok: false, response: jsonError("Not found", 404)};

    const active = await getOrganizationById(orgId);
    if (!active) return {ok: false, response: jsonError("Not found", 404)};

    if (capability && !membership.permissions[capability]) {
        return {ok: false, response: jsonError("Forbidden", 403)};
    }

    return {
        ok: true,
        data: {orgId, permissions: membership.permissions},
    };
}

export async function isOrgSlugTaken(slug: string): Promise<boolean> {
    const existing = await db.query.organization.findFirst({
        where: and(
            eq(drizzleDb.schemas.organization.slug, slug),
            isNull(drizzleDb.schemas.organization.deletedAt)
        ),
        columns: {id: true},
    });
    return Boolean(existing);
}

export function toSlug(name: string, provided?: string): string {
    return slugify(provided && provided.length > 0 ? provided : name);
}

export async function createOrganizationForUser(input: {
    userId: string;
    name: string;
    slug: string;
}) {
    return db.transaction(async (tx) => {
        const [org] = await tx
            .insert(drizzleDb.schemas.organization)
            .values({name: input.name, slug: input.slug})
            .returning();

        await tx.insert(drizzleDb.schemas.member).values({
            organizationId: org.id,
            userId: input.userId,
            role: "owner",
        });

        return org;
    });
}

export async function listOrganizationsForUser(userId: string) {
    const memberships = await db.query.member.findMany({
        where: eq(drizzleDb.schemas.member.userId, userId),
        columns: {organizationId: true},
    });
    const ids = memberships.map((m) => m.organizationId);
    if (ids.length === 0) return [];

    return db.query.organization.findMany({
        where: and(
            isNull(drizzleDb.schemas.organization.deletedAt),
            inArray(drizzleDb.schemas.organization.id, ids)
        ),
    });
}

export async function getOrganizationById(id: string) {
    return db.query.organization.findFirst({
        where: and(
            eq(drizzleDb.schemas.organization.id, id),
            isNull(drizzleDb.schemas.organization.deletedAt)
        ),
    });
}

export async function organizationHasProjects(organizationId: string): Promise<boolean> {
    const existing = await db.query.project.findFirst({
        where: and(eq(drizzleDb.schemas.project.organizationId, organizationId), eq(drizzleDb.schemas.project.isArchived, false)),
        columns: {id: true},
    });
    return Boolean(existing);
}