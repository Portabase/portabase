"use server";

import {db} from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {z} from "zod";
import {auth} from "@/lib/auth/auth";
import {MemberRoleType} from "@/types/common";
import {Member} from "better-auth/plugins/organization";
import {userAction} from "@/lib/safe-actions/actions";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {headers} from "next/headers";
import {withAuditEvent} from "@/lib/audit/with-audit-event";


export const addMemberOrganizationAction = userAction
    .schema(z.object({
        userId: z.string(),
        organizationId: z.string(),
        role: z.enum(["member", "owner", "admin"]),
    }))
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<Member | null>> => {

        const organization = await db.query.organization.findFirst({
            where: eq(drizzleDb.schemas.organization.id, parsedInput.organizationId),
        });

        const targetUser = await db.query.user.findFirst({
            where: eq(drizzleDb.schemas.user.id, parsedInput.userId),
        });

        return await withAuditEvent(
            async (): Promise<ServerActionResult<Member | null>> => {
                try {
                    if (!organization) {
                        return {
                            success: false,
                            actionError: {
                                message: "Organization not found.",
                                cause: "not_found",
                            },
                        };
                    }

                    if (!targetUser) {
                        return {
                            success: false,
                            actionError: {
                                message: "User not found.",
                                cause: "not_found",
                            },
                        };
                    }

                    const data = await auth.api.addMember({
                        body: {
                            userId: parsedInput.userId,
                            role: parsedInput.role as MemberRoleType,
                            organizationId: parsedInput.organizationId,
                        },
                        headers: await headers(),
                    });

                    return {
                        success: true,
                        value: data,
                        actionSuccess: {
                            message: "Member added successfully",
                        },
                    };
                } catch (error) {
                    return {
                        success: false,
                        actionError: {
                            message: "An error occurred while addinng member",
                            cause: error instanceof Error ? error.message : "Unknown error",
                        },
                    };
                }
            },
            {
                eventType: "organization_member.add",
                actor: {
                    type: "user",
                    id: ctx.user.id,
                    name: ctx.user.email,
                },
                organization: {
                    id: organization?.id ?? null,
                    name: organization?.name ?? null,
                },
                target: {
                    type: "user" as const,
                    id: targetUser?.id ?? null,
                    name: targetUser?.email ?? null,
                },
                metadata: {},
            },
        );
    });
