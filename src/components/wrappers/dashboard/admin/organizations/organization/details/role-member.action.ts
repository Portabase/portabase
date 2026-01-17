"use server";
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {Member} from "better-auth/plugins";
import {db as dbClient} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {RoleSchemaMember} from "@/components/wrappers/dashboard/organization/settings/member.schema";


export const updateMemberRoleAdminAction = userAction.schema(
    z.object({
        memberId: z.string(),
        organizationId: z.string(),
        role: RoleSchemaMember,
    })
).action(async ({parsedInput}): Promise<ServerActionResult<Member>> => {
    try {

        const [updatedMember] = await dbClient
            .update(drizzleDb.schemas.member)
            .set(withUpdatedAt({
                role: parsedInput.role as string,
            }))
            .where(and(eq(drizzleDb.schemas.member.id, parsedInput.memberId), eq(drizzleDb.schemas.member.organizationId, parsedInput.organizationId)))
            .returning();


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
