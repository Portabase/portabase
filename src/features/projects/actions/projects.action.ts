"use server";

import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {ProjectSchema} from "@/features/projects/schemas/projects.schema";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import {Project} from "@/db/schema/06_project";
import * as drizzleDb from "@/db";
import {Database} from "@/db/schema/07_database";
import {slugify} from "@/utils/slugify";
import {User} from "@/db/schema/02_user";
import {assertCanManageOrganization} from "@/lib/acl/organization-guard";
import {getOrganizationAvailableDatabases} from "@/db/services/database";

/** Owner/admin of the organization; databases must be ones the project form offers (its agents, not in another project). */
async function authorize(user: User, organizationId: string | undefined, databaseIds: string[], projectId?: string) {
    await assertCanManageOrganization(user, organizationId);
    if (databaseIds.length === 0) return;
    const available = new Set((await getOrganizationAvailableDatabases(organizationId!, projectId)).map((d) => d.id));
    if (!databaseIds.every((id) => available.has(id))) throw new ActionError("Database not available");
}

export const createProjectAction = userAction
    .inputSchema(
        z.object({
            data: ProjectSchema,
            organizationId: z.string(),
        })
    )
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<Project>> => {
        await authorize(ctx.user, parsedInput.organizationId, parsedInput.data.databases);
        try {
            const slug = slugify(parsedInput.data.name);

            const existingProject = await db.query.project.findFirst({
                where: and(eq(drizzleDb.schemas.project.name, parsedInput.data.name)),
            })

            if (existingProject) {
                return {
                    success: false,
                    actionError: {
                        message: "A project with this name already exists.",
                        status: 400,
                        messageParams: {projectName: parsedInput.data.name},
                    },
                };
            }

            const [createdProject] = await db
                .insert(drizzleDb.schemas.project)
                .values({
                    name: parsedInput.data.name,
                    slug: slug,
                    organizationId: parsedInput.organizationId,
                    encryption: parsedInput.data.encryption,
                })
                .returning();

            if (parsedInput.data.databases.length > 0) {
                await db
                    .update(drizzleDb.schemas.database)
                    .set({projectId: createdProject.id})
                    .where(inArray(drizzleDb.schemas.database.id, parsedInput.data.databases));
            }

            return {
                success: true,
                value: createdProject,
                actionSuccess: {
                    message: "Project has been successfully created.",
                    messageParams: {projectName: parsedInput.data.name},
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to create project.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {projectName: parsedInput.data.name},
                },
            };
        }
    });


export const updateProjectAction = userAction
    .inputSchema(
        z.object({
            data: ProjectSchema,
            organizationId: z.string(),
            projectId: z.string(),
        })
    )
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<Project>> => {
        const project = await db.query.project.findFirst({
            columns: {organizationId: true},
            where: eq(drizzleDb.schemas.project.id, parsedInput.projectId),
        });
        await authorize(ctx.user, project?.organizationId, parsedInput.data.databases, parsedInput.projectId);
        try {
            const existing = await db.query.project.findFirst({
                where: eq(drizzleDb.schemas.project.id, parsedInput.projectId),
                with: {
                    databases: {
                        where: isNull(drizzleDb.schemas.database.deletedAt),
                    },
                },
            });

            if (!existing) {
                throw new Error("Project not found.");
            }

            const existingDbIds = existing.databases.map((db: Database) => db.id);
            const newDbIds = parsedInput.data.databases;

            const databasesToAdd = newDbIds.filter((id) => !existingDbIds.includes(id));
            const databasesToRemove = existingDbIds.filter((id: string) => !newDbIds.includes(id));

            if (databasesToAdd.length > 0) {
                await db.update(drizzleDb.schemas.database).set({projectId: parsedInput.projectId}).where(inArray(drizzleDb.schemas.database.id, databasesToAdd));
            }

            if (databasesToRemove.length > 0) {
                await db.update(drizzleDb.schemas.database).set({
                    projectId: null,
                    backupPolicy: null
                }).where(inArray(drizzleDb.schemas.database.id, databasesToRemove));

                await db.delete(drizzleDb.schemas.retentionPolicy)
                    .where(inArray(drizzleDb.schemas.retentionPolicy.databaseId, databasesToRemove)).execute();

                await db.delete(drizzleDb.schemas.alertPolicy)
                    .where(inArray(drizzleDb.schemas.alertPolicy.databaseId, databasesToRemove)).execute();

            }

            const [updatedProject] = await db
                .update(drizzleDb.schemas.project)
                .set({
                    name: parsedInput.data.name,
                    encryption: parsedInput.data.encryption,
                })
                .where(eq(drizzleDb.schemas.project.id, parsedInput.projectId))
                .returning();

            return {
                success: true,
                value: updatedProject,
                actionSuccess: {
                    message: "Project has been successfully updated.",
                    messageParams: {projectName: parsedInput.data.name},
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to update project.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {projectName: parsedInput.data.name},
                },
            };
        }
    });
