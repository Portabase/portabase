"use server";

import {userAction} from "@/lib/safe-actions/actions";
import { logger } from "@/lib/logger";
import {z} from "zod";
import {v4 as uuidv4} from "uuid";
import {ServerActionResult} from "@/types/action-type";
import {eq, inArray} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";

const log = logger.child({ module: "dashboard/delete-project.action" });

type ArchivedProject = typeof drizzleDb.schemas.project.$inferSelect;

class ProjectNotFoundError extends Error {
    constructor(projectId: string) {
        super(`Project not found or update failed: ${projectId}`);
        this.name = "ProjectNotFoundError";
    }
}

/**
 * Archives a project: detach its databases (clear projectId + backupPolicy),
 * drop those databases' retention policies, then mark the project archived and
 * free its globally-unique slug/name by replacing them with a fresh UUID.
 *
 * Shared by the dashboard action and the v1 API so both behave identically.
 */
export async function archiveProjectService(projectId: string): Promise<ArchivedProject> {
    const uuid = uuidv4();

    const databasesUpdated = await db
        .update(drizzleDb.schemas.database)
        .set({
            projectId: null,
            backupPolicy: null,
        })
        .where(eq(drizzleDb.schemas.database.projectId, projectId))
        .returning();

    const databaseIds = databasesUpdated.map((database) => database.id);

    if (databaseIds.length > 0) {
        await db
            .delete(drizzleDb.schemas.retentionPolicy)
            .where(inArray(drizzleDb.schemas.retentionPolicy.databaseId, databaseIds))
            .execute();
    }

    const [updatedProject] = await db
        .update(drizzleDb.schemas.project)
        .set({
            isArchived: true,
            slug: uuid,
            name: uuid,
        })
        .where(eq(drizzleDb.schemas.project.id, projectId))
        .returning();

    if (!updatedProject) {
        throw new ProjectNotFoundError(projectId);
    }

    return updatedProject;
}

export const deleteProjectAction = userAction.schema(z.string()).action(async ({parsedInput}): Promise<ServerActionResult<ArchivedProject>> => {
    try {
        const updatedProject = await archiveProjectService(parsedInput);

        return {
            success: true,
            value: updatedProject,
            actionSuccess: {
                message: "Projects has been successfully archived.",
                messageParams: {projectId: parsedInput},
            },
        };
    } catch (error) {
        log.error({ error }, "Failed to archive project");
        return {
            success: false,
            actionError: {
                message: "Failed to archive Projects.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {projectId: parsedInput},
            },
        };
    }
});
