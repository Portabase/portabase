"use server";

import {userAction} from "@/lib/safe-actions/actions";
import {CreateOrganizationSchema, UpdateOrganizationSchema} from "@/features/organization/organization.schema";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import {db} from "@/db";
import {and, eq, inArray, or} from "drizzle-orm";
import {auth, checkSlugOrganization, createOrganization} from "@/lib/auth/auth";
import {slugify} from "@/utils/slugify";
import {Organization} from "@/db/schema/03_organization";
import * as drizzleDb from "@/db";

export const createOrganizationAction = userAction.schema(CreateOrganizationSchema).action(async ({parsedInput}): Promise<ServerActionResult<Organization>> => {
    try {
        const slug = slugify(parsedInput.name);
        if (!await checkSlugOrganization(slug)) {
            return {
                success: false,
                actionError: {
                    message: "Slug is already taken",
                    status: 500,
                    messageParams: {message: "Error creating the organization"},
                },
            };
        }

        let createdOrganization: Organization;

        try {
            createdOrganization = await createOrganization(parsedInput.name, slug) as unknown as Organization;
        } catch (authError: any) {
            console.error("Auth deletion failed:", authError);
            return {
                success: false,
                actionError: {
                    message: authError.message || "Authentication service error.",
                    status: authError.status || 500,
                    cause: "auth_error",
                    messageParams: {message: authError.message},
                },
            };
        }

        return {
            success: true,
            value: createdOrganization,
            actionSuccess: {
                message: "Organization has been successfully created.",
                messageParams: {organizationId: createdOrganization!.id},
            },
        };
    } catch (error) {
        console.error("Error creating organization:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to create organization.",
                status: 500,
                messageParams: {message: "Error creating the organization"},
            },
        };
    }
});

export const updateOrganizationAction = userAction
    .schema(
        z.object({
            data: UpdateOrganizationSchema,
            organizationId: z.string(),
        })
    )
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<Organization>> => {
        try {
            const newUserList = parsedInput.data.users;
            const organization = await db.query.organization.findFirst({
                where: eq(drizzleDb.schemas.organization.id, parsedInput.organizationId),
                with: {
                    members: true,
                }
            });

            if (!organization) {
                return {
                    success: false,
                    actionError: {
                        message: "Organization not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            const existingItemIds = organization.members
                .filter((member) => member.userId !== ctx.user.id)
                .map((member) => member.userId);
            const usersToAdd = newUserList.filter((id) => !existingItemIds.includes(id));
            const usersToRemove = existingItemIds.filter((id) => !newUserList.includes(id));

            if (usersToAdd.length > 0) {
                for (const userToAdd of usersToAdd) {
                    await auth.api.addMember({
                        body: {
                            userId: userToAdd,
                            role: "member",
                            organizationId: organization.id,
                        },

                    });
                }
            }
            if (usersToRemove.length > 0) {
                await db.delete(drizzleDb.schemas.member).where(and(inArray(drizzleDb.schemas.member.userId, usersToRemove), eq(drizzleDb.schemas.member.organizationId, organization.id))).execute();

            }
            const updatedOrganization = await db
                .update(drizzleDb.schemas.organization)
                .set({
                    name: parsedInput.data.name,
                    slug: parsedInput.data.slug,
                })
                .where(eq(drizzleDb.schemas.organization.id, parsedInput.organizationId))
                .returning()
                .execute();

            return {
                success: true,
                value: updatedOrganization as unknown as Organization,
                actionSuccess: {
                    message: "Organization has been successfully updated.",
                    messageParams: {organizationId: organization.id},
                },
            };
        } catch (error) {
            console.error("Error updating organization:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update organization.",
                    status: 500,
                    cause: "server_error",
                    messageParams: {message: "Error updating the organization"},
                },
            };
        }
    });

export const deleteOrganizationAction = userAction.schema(
    z.object({
        id: z.string().optional(),
        slug: z.string().optional(),
    })
).action(
    async ({parsedInput, ctx}): Promise<ServerActionResult<Organization>> => {
        try {
            const conditions = [];
            if (parsedInput.id) {
                conditions.push(eq(drizzleDb.schemas.organization.id, parsedInput.id));
            }
            if (parsedInput.slug) {
                conditions.push(eq(drizzleDb.schemas.organization.slug, parsedInput.slug));
            }

            const org = await db.query.organization.findFirst({
                where: or(...conditions),
            });

            if (!org) {
                return {
                    success: false,
                    actionError: {
                        message: "Organization not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            let deletedOrganization: Organization;

            try {
                [deletedOrganization] = await db
                    .delete(drizzleDb.schemas.organization)
                    .where(eq(drizzleDb.schemas.organization.id, org.id))
                    .returning();

            } catch (authError: any) {
                console.error("Auth deletion failed:", authError);
                return {
                    success: false,
                    actionError: {
                        message: authError.message || "Authentication service error.",
                        status: authError.status || 500,
                        cause: "auth_error",
                        messageParams: {message: authError.message},
                    },
                };
            }

            return {
                success: true,
                value: deletedOrganization,
                actionSuccess: {
                    message: "Organization has been successfully deleted.",
                    messageParams: {organizationId: deletedOrganization.id},
                },
            };
        } catch (error) {
            console.error("Unexpected error in deleteOrganizationAction:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to delete organization due to a server error.",
                    status: 500,
                    cause: "server_error",
                    messageParams: {message: "Internal server error while deleting the organization"},
                },
            };
        }
    }
);
