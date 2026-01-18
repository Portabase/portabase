"use server";
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {auth} from "@/lib/auth/auth";
import {ServerActionResult} from "@/types/action-type";
import {Member} from "better-auth/plugins";
import {headers} from "next/headers";
import {RoleSchemaMember} from "@/components/wrappers/dashboard/organization/settings/member.schema";


export const updateMemberRoleAction = userAction.schema(
    z.object({
        memberId: z.string(),
        organizationId: z.string(),
        role: RoleSchemaMember,
    })
).action(async ({parsedInput}): Promise<ServerActionResult<Member>> => {
    try {
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
});
