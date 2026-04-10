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

export const deleteAgentAction = userAction
    .schema(
        z.object({
            agentId: zString(),
            organizationId: zString().optional(),
            organizationIds: z.array(z.string()).optional()
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Agent>> => {
        const {agentId, organizationId, organizationIds} = parsedInput;

        try {
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
                    }
                });

                projectIds = organization?.projects?.map(project => project.id) ?? [];


            } else if (organizationIds) {

                const organizationsToRemoveDetails = await db.query.organization.findMany({
                    where: inArray(drizzleDb.schemas.organization.id, organizationIds),
                    with: {
                        projects: true
                    }
                });

                projectIds = organizationsToRemoveDetails.flatMap(org =>
                    org.projects.map(project => project.id)
                );

            }


            if (projectIds?.length > 0) {
                const databases = await db.query.database.findMany({
                    where: (db, {inArray}) => inArray(db.projectId, projectIds),
                    columns: {id: true}
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


            const updatedAgent = await db
                .update(drizzleDb.schemas.agent)
                .set(withUpdatedAt({
                    isArchived: true,
                    slug: uuid,
                    deletedAt: new Date()
                }))
                .where(eq(drizzleDb.schemas.agent.id, agentId))
                .returning();


            if (!updatedAgent[0]) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent not found or update failed",
                        status: 404,
                        messageParams: {agentId: agentId},
                    },
                };
            }

            return {
                success: true,
                value: updatedAgent[0],
                actionSuccess: {
                    message: "Agent has been successfully deleted.",
                    messageParams: {projectId: agentId},
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to delete agent.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {agentId: agentId},
                },
            };
        }
    });
