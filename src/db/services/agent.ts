import {desc, eq} from "drizzle-orm";
import {db} from "@/db";
import {Agent, agent, organizationAgent} from "@/db/schema/08_agent";

export async function getOrganizationAgents(organizationId: string) {

    return await db
        .select({
            id: agent.id,
            name: agent.name,
            // organizationId: agent.organizationId,
            // slug: agent.slug,
            // healthErrorCount: agent.healthErrorCount,
            // description: agent.description,
            // isArchived: agent.isArchived,
            // lastContact: agent.lastContact,
            // version: agent.version,
            // updatedAt: agent.updatedAt,
            // createdAt: agent.createdAt,
            // deletedAt: agent.deletedAt,
        })
        .from(organizationAgent)
        .innerJoin(
            agent,
            eq(organizationAgent.agentId, agent.id)
        )
        .orderBy(desc(agent.createdAt))
        .where(eq(organizationAgent.organizationId, organizationId)) as unknown as Agent[];
}
