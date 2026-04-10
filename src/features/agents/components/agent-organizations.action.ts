"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import {and, eq, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {AgentWith} from "@/db/schema/08_agent";
import {withUpdatedAt} from "@/db/utils";


export const updateAgentOrganizationsAction = userAction
    .schema(
        z.object({
            data: z.array(z.string()),
            id: z.string(),
        })
    )
    .action(async ({parsedInput , ctx}): Promise<ServerActionResult<null>> => {
        try {
            const organizationsIds = parsedInput.data;
            const agentId = parsedInput.id;

            const agent = await db.query.agent.findFirst({
                where: eq(drizzleDb.schemas.agent.id, agentId),
                with: {
                    organizations: true,
                    databases: true
                }
            }) as AgentWith;


            if (!agent) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            const existingItemIds = agent.organizations.map((organization) => organization.organizationId);

            const organizationsToAdd = organizationsIds.filter((id) => !existingItemIds.includes(id));
            const organizationsToRemove = existingItemIds.filter((id) => !organizationsIds.includes(id));

            if (organizationsToAdd.length > 0) {
                for (const organizationToAdd of organizationsToAdd) {
                    await db.insert(drizzleDb.schemas.organizationAgent).values({
                        organizationId: organizationToAdd,
                        agentId: agentId
                    });
                }
            }
            if (organizationsToRemove.length > 0) {
                await db.delete(drizzleDb.schemas.organizationAgent).where(and(inArray(drizzleDb.schemas.organizationAgent.organizationId, organizationsToRemove), eq(drizzleDb.schemas.organizationAgent.agentId,agentId))).execute();

                const organizationsToRemoveDetails = await db.query.organization.findMany({
                    where: inArray(drizzleDb.schemas.organization.id, organizationsToRemove),
                    with: {
                        projects: true
                    }
                });

                const projectIds = organizationsToRemoveDetails.flatMap(org =>
                    org.projects.map(project => project.id)
                );

                if (projectIds.length > 0) {
                    const databases = await db.query.database.findMany({
                        where: (db, { inArray }) => inArray(db.projectId, projectIds),
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

            return {
                success: true,
                value: null,
                actionSuccess: {
                    message: "Agent organizations has been successfully updated.",
                    messageParams: {agentId: agentId},
                },
            };
        } catch (error) {
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

