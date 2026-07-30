"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { Member } from "better-auth/plugins";
import { userAction } from "@/lib/safe-actions/actions";
import { headers } from "next/headers";
import { withAuditEvent } from "@/lib/audit/with-audit-event";
import { User } from "@/db/schema/02_user";
import { and, eq } from "drizzle-orm";

const removeMemberOrganizationSchema = z.object({
    memberId: z.string(),
    organizationId: z.string(),
});

export type RemoveMemberOrganizationInput = z.infer<typeof removeMemberOrganizationSchema>;

export async function removeMemberOrganization(
    parsedInput: RemoveMemberOrganizationInput,
    actor: User,
): Promise<ServerActionResult<Member>> {
    const member = await db.query.member.findFirst({
        where: and(
            eq(drizzleDb.schemas.member.id, parsedInput.memberId),
            eq(drizzleDb.schemas.member.organizationId, parsedInput.organizationId),
        ),
        with: {
            user: true,
            organization: true,
        },
    });

    return await withAuditEvent(
        async (): Promise<ServerActionResult<Member>> => {
            try {
                if (!member) {
                    return {
                        success: false,
                        actionError: {
                            message: "Member not found.",
                            cause: "not_found",
                        },
                    };
                }

                const response = await auth.api.removeMember({
                    body: {
                        memberIdOrEmail: parsedInput.memberId,
                        organizationId: parsedInput.organizationId,
                    },
                    headers: await headers(),
                });

                return {
                    success: true,
                    value: response.member as Member,
                    actionSuccess: {
                        message: "Member removed successfully",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "An error occurred while deleting member",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "organization_member.remove",
            actor: {
                type: "user" as const,
                id: actor.id,
                name: actor.email,
            },
            organization: {
                id: member?.organization.id ?? null,
                name: member?.organization.name ?? null,
            },
            target: {
                type: "user" as const,
                id: member?.user.id ?? null,
                name: member?.user.email ?? null,
            },
            metadata: {},
        },
    );
}

export const removeMemberOrganizationAction = userAction
    .schema(removeMemberOrganizationSchema)
    .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<Member>> => {
        return await removeMemberOrganization(parsedInput, ctx.user);
    });
