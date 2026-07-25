import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and, isNull } from "drizzle-orm";
import {getAccessibleAgentIds} from "@/lib/api-v1/services/agents";
import {ApiKeyContext, ApiKeyContextUser} from "@/lib/api-v1/types";
import {NextResponse} from "next/server";
import { withUpdatedAt } from "@/db/utils";


export async function getAccessibleDatabaseIds(user: ApiKeyContextUser): Promise<string[]> {
    const agentIds = await getAccessibleAgentIds(user);
    if (agentIds.length === 0) return [];

    const databases = await db.query.database.findMany({
        where: and(
            inArray(drizzleDb.schemas.database.agentId, agentIds),
            isNull(drizzleDb.schemas.database.deletedAt)
        ),
        columns: { id: true },
    });

    return databases.map((d) => d.id);
}

export async function getAccessibleDatabases(user: ApiKeyContext["user"]) {
    const agentIds = await getAccessibleAgentIds(user);

    if (agentIds.length === 0) {
        return [];
    }

    return db.query.database.findMany({
        where: and(
            inArray(drizzleDb.schemas.database.agentId, agentIds),
            isNull(drizzleDb.schemas.database.deletedAt)
        ),
    });
}


type GuardResult<T> =
    | {
    ok: true;
    data: T;
}
    | {
    ok: false;
    response: NextResponse;
};

function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function requireDatabaseAccess(
    params: Record<string, string> | undefined,
    user: ApiKeyContext["user"]
): Promise<GuardResult<{ id: string }>> {
    const id = params?.id;

    if (!id) {
        return {
            ok: false,
            response: jsonError("Not found", 404),
        };
    }

    const access = await resolveDatabaseAccess(id, user);


    if (access === "ok") {
        return {
            ok: true,
            data: { id },
        };
    }

    if (access === "forbidden") {
        return {
            ok: false,
            response: jsonError("Forbidden", 403),
        };
    }

    if (access === "no_project_link") {
        return {
            ok: false,
            response: jsonError("Database is not linked to any project", 403),
        };
    }


    return {
        ok: false,
        response: jsonError("Not found", 404),
    };
}

export type DatabaseAccessResult =
    | "ok"
    | "forbidden"
    | "not_found"
    | "no_project_link";

export async function resolveDatabaseAccess(
    id: string,
    user: ApiKeyContext["user"]
): Promise<DatabaseAccessResult> {
    const [accessibleIds, database] = await Promise.all([
        getAccessibleDatabaseIds(user),
        db.query.database.findFirst({
            where: and(
                eq(drizzleDb.schemas.database.id, id),
                isNull(drizzleDb.schemas.database.deletedAt)
            ),
            columns: {
                id: true,
                projectId: true,
            },
        }),
    ]);

    if (!database) {
        return "not_found";
    }

    if (database.projectId === null) {
        return "no_project_link";
    }

    if (accessibleIds.includes(id)) {
        return "ok";
    }

    return "forbidden";
}

export type AssignToProjectResult =
    | { ok: true }
    | { ok: false; reason: "project_not_found" | "agent_not_in_org" };

/**
 * Verifies the database's agent is attached to the target project's
 * organization (junction canonical, direct FK as fallback), then sets projectId.
 * Assumes the caller already passed `requireDatabaseAccess` for `databaseId`.
 */
export async function assignDatabaseToProject(
    databaseId: string,
    projectId: string
): Promise<AssignToProjectResult> {
    const project = await db.query.project.findFirst({
        where: eq(drizzleDb.schemas.project.id, projectId),
        columns: { id: true, organizationId: true },
    });
    if (!project) return { ok: false, reason: "project_not_found" };

    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.id, databaseId),
        columns: { id: true, agentId: true },
    });
    if (!database?.agentId) return { ok: false, reason: "agent_not_in_org" };

    const agent = await db.query.agent.findFirst({
        where: eq(drizzleDb.schemas.agent.id, database.agentId),
        with: { organizations: true },
        columns: { id: true, organizationId: true },
    });

    const inOrg =
        agent?.organizationId === project.organizationId ||
        (agent?.organizations ?? []).some((o) => o.organizationId === project.organizationId);

    if (!inOrg) return { ok: false, reason: "agent_not_in_org" };

    await db
        .update(drizzleDb.schemas.database)
        .set(withUpdatedAt({ projectId }))
        .where(eq(drizzleDb.schemas.database.id, databaseId));

    return { ok: true };
}

export async function updateDatabaseFields(
    databaseId: string,
    data: { name?: string; description?: string | null }
) {
    const [updated] = await db
        .update(drizzleDb.schemas.database)
        .set(withUpdatedAt(data))
        .where(eq(drizzleDb.schemas.database.id, databaseId))
        .returning();
    return updated;
}