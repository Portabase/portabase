"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {AgentWith} from "@/db/schema/08_agent";
import {withUpdatedAt} from "@/db/utils";

class AgentNotFoundError extends Error {
    constructor(agentId: string) {
        super(`Agent not found: ${agentId}`);
        this.name = "AgentNotFoundError";
    }
}

export async function attachAgentToOrganizationsService(
    agentId: string,
    organizationIds: string[]
): Promise<void> {
    for (const organizationId of organizationIds) {
        await db.insert(drizzleDb.schemas.organizationAgent).values({
            organizationId,
            agentId,
        });
    }
}

export async function detachAgentFromOrganizationsService(
    agentId: string,
    organizationIds: string[]
): Promise<void> {
    if (organizationIds.length === 0) return;

    await db
        .delete(drizzleDb.schemas.organizationAgent)
        .where(and(
            inArray(drizzleDb.schemas.organizationAgent.organizationId, organizationIds),
            eq(drizzleDb.schemas.organizationAgent.agentId, agentId)
        ))
        .execute();

    const organizationsToRemoveDetails = await db.query.organization.findMany({
        where: inArray(drizzleDb.schemas.organization.id, organizationIds),
        with: {
            projects: true
        }
    });

    const projectIds = organizationsToRemoveDetails.flatMap(org =>
        org.projects.map(project => project.id)
    );

    if (projectIds.length > 0) {
        const databases = await db.query.database.findMany({
            where: (database, { inArray, and, isNull }) => and(inArray(database.projectId, projectIds), isNull(database.deletedAt)),
            columns: { id: true }
        });

        const databaseIds = databases.map(d => d.id);

        await db
            .update(drizzleDb.schemas.database)
            .set(withUpdatedAt({
                backupPolicy: null,
                projectId: null
            }))
            .where(inArray(drizzleDb.schemas.database.projectId, projectIds))
            .execute();

        if (databaseIds.length > 0) {
            await db.delete(drizzleDb.schemas.retentionPolicy)
                .where(inArray(drizzleDb.schemas.retentionPolicy.databaseId, databaseIds))
                .execute();

            await db.delete(drizzleDb.schemas.alertPolicy)
                .where(inArray(drizzleDb.schemas.alertPolicy.databaseId, databaseIds))
                .execute();

            await db.delete(drizzleDb.schemas.storagePolicy)
                .where(inArray(drizzleDb.schemas.storagePolicy.databaseId, databaseIds))
                .execute();
        }
    }
}

export async function updateAgentOrganizationsService(
    agentId: string,
    organizationIds: string[]
): Promise<void> {
    const agent = await db.query.agent.findFirst({
        where: eq(drizzleDb.schemas.agent.id, agentId),
        with: {
            organizations: true,
            databases: {
                where: isNull(drizzleDb.schemas.database.deletedAt),
            },
        }
    }) as AgentWith;

    if (!agent) {
        throw new AgentNotFoundError(agentId);
    }

    const existingItemIds = agent.organizations.map((organization) => organization.organizationId);

    const organizationsToAdd = organizationIds.filter((id) => !existingItemIds.includes(id));
    const organizationsToRemove = existingItemIds.filter((id) => !organizationIds.includes(id));

    if (organizationsToAdd.length > 0) {
        await attachAgentToOrganizationsService(agentId, organizationsToAdd);
    }
    if (organizationsToRemove.length > 0) {
        await detachAgentFromOrganizationsService(agentId, organizationsToRemove);
    }
}

export const updateAgentOrganizationsAction = userAction
    .inputSchema(
        z.object({
            data: z.array(z.string()),
            id: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<null>> => {
        try {
            await updateAgentOrganizationsService(parsedInput.id, parsedInput.data);

            return {
                success: true,
                value: null,
                actionSuccess: {
                    message: "Agent organizations has been successfully updated.",
                    messageParams: {agentId: parsedInput.id},
                },
            };
        } catch (error) {
            if (error instanceof AgentNotFoundError) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            console.error("Error updating agent organizations:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update agent organizations.",
                    status: 500,
                    cause: "server_error",
                    messageParams: {message: "Error updating the agent organizations"},
                },
            };
        }
    });
