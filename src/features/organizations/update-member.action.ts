"use server";
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {auth} from "@/lib/auth/auth";
import {ServerActionResult} from "@/types/action-type";
import {Member} from "better-auth/plugins";
import {headers} from "next/headers";
import {RoleSchemaMember} from "@/features/organizations/member.schema";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq } from "drizzle-orm";
import { withAuditEvent } from "@/lib/audit/with-audit-event";


export const updateMemberRoleAction = userAction.schema(
    z.object({
        memberId: z.string(),
        organizationId: z.string(),
        role: RoleSchemaMember,
    })
).action(async ({parsedInput, ctx}): Promise<ServerActionResult<Member>> => {
    const currentMember = await db.query.member.findFirst({
        where: and(
            eq(drizzleDb.schemas.member.id, parsedInput.memberId),
            eq(drizzleDb.schemas.member.organizationId, parsedInput.organizationId),
        ),
        with: {
            user: true,
            organization: true,
        },
    });

    const nextRole = typeof parsedInput.role === "string" ? parsedInput.role : parsedInput.role[0];

    return await withAuditEvent(
        async (): Promise<ServerActionResult<Member>> => {
            try {
                if (!currentMember) {
                    return {
                        success: false,
                        actionError: {
                            message: "Failed to update member role.",
                            status: 404,
                            cause: "not_found",
                            messageParams: {},
                        },
                    };
                }

                const updatedMember = await auth.api.updateMemberRole({
                    body: {
                        role: parsedInput.role,
                        memberId: parsedInput.memberId,
                        organizationId: parsedInput.organizationId,
                    },
                    headers: await headers(),
                });

                return {
                    success: true,
                    value: updatedMember,
                    actionSuccess: {
                        message: "Member has been successfully updated.",
                        messageParams: {},
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "Failed to update member role.",
                        status: 500,
                        cause: error instanceof Error ? error.message : "Unknown error",
                        messageParams: {},
                    },
                };
            }
        },
        {
            eventType: "organization_member.role_update",
            actor: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            organization: {
                id: currentMember?.organization.id ?? null,
                name: currentMember?.organization.name ?? null,
            },
            target: {
                type: "user" as const,
                id: currentMember?.user.id ?? null,
                name: currentMember?.user.email ?? null,
            },
            metadata: {
                oldRole: currentMember?.role ?? null,
                newRole: nextRole,
            },
        },
    );
});
