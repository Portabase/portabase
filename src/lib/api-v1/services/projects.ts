import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { slugify } from "@/utils/slugify";
import { Project } from "@/db/schema/06_project";

type GuardResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function isProjectSlugTaken(slug: string): Promise<boolean> {
  const existing = await db.query.project.findFirst({
    where: eq(drizzleDb.schemas.project.slug, slug),
    columns: { id: true },
  });
  return Boolean(existing);
}

export function projectSlug(name: string, provided?: string): string {
  return slugify(provided && provided.length > 0 ? provided : name);
}

export async function createProject(input: {
  organizationId: string;
  name: string;
  slug: string;
}) {
  const [project] = await db
    .insert(drizzleDb.schemas.project)
    .values({
      name: input.name,
      slug: input.slug,
      organizationId: input.organizationId,
    })
    .returning();
  return project;
}

export async function listProjects(organizationId: string) {
  return db.query.project.findMany({
    where: eq(drizzleDb.schemas.project.organizationId, organizationId),
  });
}


export async function requireProjectAccess(
  ctx: ApiKeyContext,
  projectId: string | undefined
): Promise<GuardResult<{ project: Project }>> {
  if (!projectId) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const project = await db.query.project.findFirst({
    where: eq(drizzleDb.schemas.project.id, projectId),
  });
  if (!project) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const member = ctx.organizations.find((o) => o.id === project.organizationId);
  if (!member) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { ok: true, data: { project } };
}

