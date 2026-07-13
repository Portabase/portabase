import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, inArray, and, or, isNull } from "drizzle-orm";
import {ApiKeyContextUser} from "@/lib/api-v1/types";
import {AgentWith} from "@/db/schema/08_agent";

export async function getAccessibleAgentIds(
    user: ApiKeyContextUser
): Promise<string[]> {

    const memberships = await db.query.member.findMany({
        where: and(
            eq(drizzleDb.schemas.member.userId, user.id),
            or(
                eq(drizzleDb.schemas.member.role, "admin"),
                eq(drizzleDb.schemas.member.role, "owner")
            )
        ),
        columns: { organizationId: true },
    });

    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) {
        return [];
    }

    const isActiveAgent = or(
        eq(drizzleDb.schemas.agent.isArchived, false),
        isNull(drizzleDb.schemas.agent.isArchived)
    );

    const orgAgents = await db.query.organizationAgent.findMany({
        where: inArray(
            drizzleDb.schemas.organizationAgent.organizationId,
            orgIds
        ),
        columns: { agentId: true },
    });

    const junctionAgentIds = orgAgents.map((oa) => oa.agentId);

    let directAgentIds: string[] = [];

    if (user.permissions.isAdmin || user.permissions.isSuperAdmin) {
        const directAgents = await db.query.agent.findMany({
            where: isActiveAgent,
            columns: { id: true },
        });

        directAgentIds = directAgents.map((a) => a.id);
    }

    const allAgentIds = [
        ...new Set([
            ...junctionAgentIds,
            ...directAgentIds,
        ]),
    ];

    if (allAgentIds.length === 0) {
        return [];
    }

    const agents = await db.query.agent.findMany({
        where: and(
            inArray(drizzleDb.schemas.agent.id, allAgentIds),
            isActiveAgent
        ),
        columns: { id: true },
    });

    return agents.map((a) => a.id);
}

export async function resolveAgentAccess(id: string, user: ApiKeyContextUser) {
    const accessibleAgentIds = await getAccessibleAgentIds(user);
    if (accessibleAgentIds.includes(id)) return "ok";

    const exists = await db.query.agent.findFirst({
        where: and(
            eq(drizzleDb.schemas.agent.id, id),
            or(
                eq(drizzleDb.schemas.agent.isArchived, false),
                isNull(drizzleDb.schemas.agent.deletedAt)
            )
        ),
        columns: { id: true },
    });

    return exists ? "forbidden" : "not_found";
}


type GetAgentOptions = {
    includeDatabases?: boolean;
    includeOrganizations?: boolean;
};

export async function getAgent(
    id: string,
    options: GetAgentOptions = {}
) {
    const agent = drizzleDb.schemas.agent;

    const withRelations: {
        databases?: true;
        organizations?: true;
    } = {};

    if (options.includeDatabases) {
        withRelations.databases = true;
    }

    if (options.includeOrganizations) {
        withRelations.organizations = true;
    }

    return db.query.agent.findFirst({
        where: and(
            eq(agent.id, id),
            eq(agent.isArchived, false),
            isNull(agent.deletedAt)
        ),
        ...(Object.keys(withRelations).length > 0
            ? { with: withRelations }
            : {}),
    }) as unknown as AgentWith;
}