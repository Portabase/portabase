import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and, isNull } from "drizzle-orm";
import {getAccessibleAgentIds} from "@/lib/api-v1/services/agents";
import {ApiKeyContext, ApiKeyContextUser} from "@/lib/api-v1/types";
import {NextResponse} from "next/server";


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
    const accessibleIds = await getAccessibleDatabaseIds(user);

    if (accessibleIds.includes(id)) {
        return "ok";
    }

    const database = await db.query.database.findFirst({
        where: and(
            eq(drizzleDb.schemas.database.id, id),
            isNull(drizzleDb.schemas.database.deletedAt)
        ),
        columns: {
            id: true,
            projectId: true,
        },
    });

    if (!database) {
        return "not_found";
    }

    if (database.projectId === null) {
        return "no_project_link";
    }

    return "forbidden";
}