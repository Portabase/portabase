"use server";

import {userAction} from "@/lib/safe-actions/actions";
import {CreateOrganizationSchema, UpdateOrganizationSchema} from "@/features/organizations/organization.schema";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import {db} from "@/db";
import {eq, or} from "drizzle-orm";
import {checkSlugOrganization, createOrganization} from "@/lib/auth/auth";
import {slugify} from "@/utils/slugify";
import {Organization} from "@/db/schema/03_organization";
import * as drizzleDb from "@/db";
import { withAuditEvent } from "@/lib/audit/with-audit-event";
import { addMemberOrganizationAction } from "@/features/organizations/add-member.action";
import { removeMemberOrganization } from "@/features/organizations/remove-member.action";

export const createOrganizationAction = userAction.schema(CreateOrganizationSchema).action(async ({parsedInput, ctx}): Promise<ServerActionResult<Organization>> => {
    const slug = slugify(parsedInput.name);

    return await withAuditEvent(
        async (): Promise<ServerActionResult<Organization>> => {
            try {
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
                        messageParams: {organizationId: createdOrganization.id},
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "Failed to create organization.",
                        status: 500,
                        messageParams: {message: "Error creating the organization"},
                    },
                };
            }
        },
        {
            eventType: "organization.create",
            actor: {
                type: "user",
                id: ctx.user.id,
                name: ctx.user.email,
            },
            target: {
                type: "organization",
                id: null,
                name: parsedInput.name,
            },
            onSuccess: (result) => {
                return {
                    organization: {
                        id: result.value?.id ?? null,
                        name: result.value?.name ?? parsedInput.name,
                    },
                    target: {
                        type: "organization",
                        id: result.value?.id ?? null,
                        name: result.value?.name ?? parsedInput.name,
                    },
                };
            },
        },
    );
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
                    members: {
                        with: {
                            user: true,
                        },
                    },
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

            const hasOrganizationChanges =
                organization.name !== parsedInput.data.name || organization.slug !== parsedInput.data.slug;
            const existingItemIds = organization.members
                .filter((member) => member.userId !== ctx.user.id)
                .map((member) => member.userId);
            const usersToAdd = newUserList.filter((id) => !existingItemIds.includes(id));
            const membersToRemove = organization.members.filter(
                (member) => member.userId !== ctx.user.id && !newUserList.includes(member.userId),
            );

            if (hasOrganizationChanges) {
                const organizationUpdateResult = await withAuditEvent(
                    async (): Promise<ServerActionResult<Organization>> => {
                        try {
                            const [updatedOrganization] = await db
                                .update(drizzleDb.schemas.organization)
                                .set({
                                    name: parsedInput.data.name,
                                    slug: parsedInput.data.slug,
                                })
                                .where(eq(drizzleDb.schemas.organization.id, parsedInput.organizationId))
                                .returning();

                            return {
                                success: true,
                                value: updatedOrganization,
                                actionSuccess: {
                                    message: "Organization has been successfully updated.",
                                    messageParams: {organizationId: organization.id},
                                },
                            };
                        } catch (error) {
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
                    },
                    {
                        eventType: "organization.update",
                        actor: {
                            type: "user" as const,
                            id: ctx.user.id,
                            name: ctx.user.email,
                        },
                        organization: {
                            id: organization.id,
                            name: organization.name,
                        },
                        target: {
                            type: "organization" as const,
                            id: organization.id,
                            name: organization.name,
                        },
                        metadata: {},
                        onSuccess: () => ({
                            organization: {
                                id: organization.id,
                                name: parsedInput.data.name,
                            },
                            target: {
                                type: "organization" as const,
                                id: organization.id,
                                name: parsedInput.data.name,
                            },
                        }),
                    },
                );

                if (!organizationUpdateResult.success) {
                    return organizationUpdateResult;
                }
            }

            if (usersToAdd.length > 0) {
                for (const userToAdd of usersToAdd) {
                    const addMemberResult = await addMemberOrganizationAction({
                        userId: userToAdd,
                        role: "member",
                        organizationId: organization.id,
                    });

                    if (!addMemberResult.success) {
                        return addMemberResult;
                    }
                }
            }

            if (membersToRemove.length > 0) {
                for (const memberToRemove of membersToRemove) {
                    const removeMemberResult = await removeMemberOrganization({
                        memberId: memberToRemove.id,
                        organizationId: organization.id,
                    }, ctx.user);

                    if (!removeMemberResult.success) {
                        return removeMemberResult;
                    }
                }
            }

            const updatedOrganization = await db.query.organization.findFirst({
                where: eq(drizzleDb.schemas.organization.id, parsedInput.organizationId),
            });

            if (!updatedOrganization) {
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

            return {
                success: true,
                value: updatedOrganization,
                actionSuccess: {
                    message: "Organization has been successfully updated.",
                    messageParams: {organizationId: organization.id},
                },
            };
        } catch (error) {
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

        return await withAuditEvent(
            async (): Promise<ServerActionResult<Organization>> => {
                try {
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
            },
            {
                eventType: "organization.delete",
                actor: {
                    type: "user" as const,
                    id: ctx.user.id,
                    name: ctx.user.email,
                },
                organization: {
                    id: org?.id ?? null,
                    name: org?.name ?? null,
                },
                target: {
                    type: "organization" as const,
                    id: org?.id ?? null,
                    name: org?.name ?? null,
                },
                metadata: {},
            },
        );
    }
);
