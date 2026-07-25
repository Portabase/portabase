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

export type AttachAgentResult =
  | "ok"
  | "agent_not_found"
  | "not_global"
  | "already_attached";

/**
 * A "global/system" agent has no organizationId and no junction rows.
 * Only such an agent may be freshly attributed to an organization.
 */
export async function attachAgentToOrganization(
  agentId: string,
  organizationId: string
): Promise<AttachAgentResult> {
  const agent = await db.query.agent.findFirst({
    where: and(
      eq(drizzleDb.schemas.agent.id, agentId),
      isNull(drizzleDb.schemas.agent.deletedAt)
    ),
    with: { organizations: true },
    columns: { id: true, organizationId: true },
  });

  if (!agent) return "agent_not_found";
  if (agent.organizationId || agent.organizations.length > 0) return "not_global";

  await db.insert(drizzleDb.schemas.organizationAgent).values({
    organizationId,
    agentId,
  });

  return "ok";
}

export async function detachAgentFromOrganization(
  agentId: string,
  organizationId: string
): Promise<void> {
  await db
    .delete(drizzleDb.schemas.organizationAgent)
    .where(
      and(
        eq(drizzleDb.schemas.organizationAgent.agentId, agentId),
        eq(drizzleDb.schemas.organizationAgent.organizationId, organizationId)
      )
    );
}

export async function listOrganizationAgents(organizationId: string) {
  const rows = await db.query.organizationAgent.findMany({
    where: eq(drizzleDb.schemas.organizationAgent.organizationId, organizationId),
    columns: { agentId: true },
  });
  const ids = rows.map((r) => r.agentId);
  if (ids.length === 0) return [];

  return db.query.agent.findMany({
    where: and(
      inArray(drizzleDb.schemas.agent.id, ids),
      isNull(drizzleDb.schemas.agent.deletedAt)
    ),
  });
}