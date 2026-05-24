"use server";

import { ServerActionResult } from "@/types/action-type";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { MemberRoleType } from "@/types/common";
import { Member } from "better-auth/plugins/organization";
import {userAction} from "@/lib/safe-actions/actions";

export const addMemberOrganizationAction = userAction
    .schema(
        z.object({
            userId: z.string(),
            organizationId: z.string(),
            role: z.string(),
        })
    )
    .action(async ({ parsedInput }): Promise<ServerActionResult<Member | null>> => {
        try {
            const data = await auth.api.addMember({
                body: {
                    userId: parsedInput.userId,
                    role: parsedInput.role as MemberRoleType,
                    organizationId: parsedInput.organizationId,
                },
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
    });
