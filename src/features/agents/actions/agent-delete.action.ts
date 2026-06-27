"use server";

import {z} from "zod";
import {v4 as uuidv4} from "uuid";
import {ServerActionResult} from "@/types/action-type";
import {and, eq, inArray} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Agent} from "@/db/schema/08_agent";
import {userAction} from "@/lib/safe-actions/actions";
import {zString} from "@/lib/zod";
import {withUpdatedAt} from "@/db/utils";

type DeleteAgentInput = {
    organizationId?: string;
    agentId: string;
    organizationIds?: string[];
};

class AgentNotFoundError extends Error {
    constructor(agentId: string) {
        super(`Agent not found or update failed: ${agentId}`);
        this.name = "AgentNotFoundError";
    }
}

export async function deleteAgentService(input: DeleteAgentInput): Promise<Agent> {
    const {agentId, organizationId, organizationIds} = input;

    let projectIds: string[] = [];

    const uuid = uuidv4();

    if (organizationId) {
        await db
            .delete(drizzleDb.schemas.organizationAgent)
            .where(
                and(
                    eq(drizzleDb.schemas.organizationAgent.organizationId, organizationId),
                    eq(drizzleDb.schemas.organizationAgent.agentId, agentId)
                )
            );

        const organization = await db.query.organization.findFirst({
            where: eq(drizzleDb.schemas.organization.id, organizationId),
            with: {
                projects: true,
            },
        });

        projectIds = organization?.projects?.map((project) => project.id) ?? [];
    } else if (organizationIds?.length) {
        const organizationsToRemoveDetails = await db.query.organization.findMany({
            where: inArray(drizzleDb.schemas.organization.id, organizationIds),
            with: {
                projects: true,
            },
        });

        projectIds = organizationsToRemoveDetails.flatMap((org) =>
            org.projects.map((project) => project.id)
        );
    }

    if (projectIds.length > 0) {
        const databases = await db.query.database.findMany({
            where: (database, {inArray}) => inArray(database.projectId, projectIds),
            columns: {
                id: true,
            },
        });

        const databaseIds = databases.map((database) => database.id);

        await db
            .update(drizzleDb.schemas.database)
            .set(
                withUpdatedAt({
                    backupPolicy: null,
                    projectId: null,
                })
            )
            .where(inArray(drizzleDb.schemas.database.projectId, projectIds))
            .execute();

        if (databaseIds.length > 0) {
            await db
                .delete(drizzleDb.schemas.retentionPolicy)
                .where(
                    inArray(
                        drizzleDb.schemas.retentionPolicy.databaseId,
                        databaseIds
                    )
                )
                .execute();

            await db
                .delete(drizzleDb.schemas.alertPolicy)
                .where(
                    inArray(
                        drizzleDb.schemas.alertPolicy.databaseId,
                        databaseIds
                    )
                )
                .execute();

            await db
                .delete(drizzleDb.schemas.storagePolicy)
                .where(
                    inArray(
                        drizzleDb.schemas.storagePolicy.databaseId,
                        databaseIds
                    )
                )
                .execute();
        }
    }

    const [updatedAgent] = await db
        .update(drizzleDb.schemas.agent)
        .set(
            withUpdatedAt({
                isArchived: true,
                slug: uuid,
                deletedAt: new Date(),
            })
        )
        .where(eq(drizzleDb.schemas.agent.id, agentId))
        .returning();

    if (!updatedAgent) {
        throw new AgentNotFoundError(agentId);
    }

    return updatedAgent;
}

export const deleteAgentAction = userAction
    .schema(
        z.object({
            agentId: zString(),
            organizationId: zString().optional(),
            organizationIds: z.array(zString()).optional(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Agent>> => {
        try {
            const deletedAgent = await deleteAgentService(parsedInput);

            return {
                success: true,
                value: deletedAgent,
                actionSuccess: {
                    message: "Agent has been successfully deleted.",
                    messageParams: {
                        agentId: parsedInput.agentId,
                    },
                },
            };
        } catch (error) {
            if (error instanceof AgentNotFoundError) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent not found or update failed",
                        status: 404,
                        messageParams: {
                            agentId: parsedInput.agentId,
                        },
                    },
                };
            }

            return {
                success: false,
                actionError: {
                    message: "Failed to delete agent.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {
                        agentId: parsedInput.agentId,
                    },
                },
            };
        }
    });