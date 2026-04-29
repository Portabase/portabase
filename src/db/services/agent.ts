import {and, desc, eq, sql} from "drizzle-orm";
import {db} from "@/db";
import {Agent, agent, organizationAgent} from "@/db/schema/08_agent";
import {Database, database} from "@/db/schema/07_database";

export async function getOrganizationAgents(organizationId: string) {

    return await db
        .select({
            id: agent.id,
            name: agent.name,
            organizationId: agent.organizationId,
            slug: agent.slug,
            healthErrorCount: agent.healthErrorCount,
            description: agent.description,
            isArchived: agent.isArchived,
            lastContact: agent.lastContact,
            version: agent.version,
            updatedAt: agent.updatedAt,
            createdAt: agent.createdAt,
            deletedAt: agent.deletedAt,
            databases: sql<Database[]>`
                COALESCE(
                    json_agg(${database}.*) FILTER (WHERE ${database}.id IS NOT NULL),
                    '[]'
                )
            `,
        })
        .from(organizationAgent)
        .innerJoin(
            agent,
            eq(organizationAgent.agentId, agent.id)
        )
        .leftJoin(database, eq(database.agentId, agent.id))
        .groupBy(agent.id)
        .orderBy(desc(agent.createdAt))
        .where(
            and(
                eq(organizationAgent.organizationId, organizationId),
                eq(agent.isArchived, false)
            )
        ) as unknown as Agent[];
}
