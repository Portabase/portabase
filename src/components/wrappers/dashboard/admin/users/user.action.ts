"use server";

import * as drizzleDb from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {render} from "@react-email/render";
import {UserSchema} from "@/components/wrappers/dashboard/admin/users/user.schema";
import {extractNameFromEmail} from "@/utils/name-from-email";
import {generateValidPassword} from "@/utils/password";
import {auth} from "@/lib/auth/auth";
import {z} from "zod";
import {Organization} from "@/db/schema/03_organization";
import {db} from "@/db";
import {and, eq} from "drizzle-orm";

import {zEmail, zString} from "@/lib/zod";
import {withUpdatedAt} from "@/db/utils";
import {userAction} from "@/lib/safe-actions/actions";
import {
    addMemberOrganizationAction
} from "@/components/wrappers/dashboard/admin/organizations/organization/details/add-member.action";
import {sendEmail} from "@/lib/email";
import EmailCreateUser from "@/components/emails/email-create-user";
import {SignUpUser} from "@/types/auth";
import {createUserDb} from "@/db/services/user";
import {User} from "@/db/schema/02_user";

export const createUserAction = userAction.schema(UserSchema).action(async ({parsedInput}): Promise<ServerActionResult<User>> => {
    try {
        const password = generateValidPassword();

        const userData: SignUpUser = {
            name: parsedInput.name || extractNameFromEmail(parsedInput.email),
            email: parsedInput.email,
            password: password,
            theme: "dark",
            role: "user",
        };

        const newUser = await createUserDb(userData);

        if (newUser) {

            await sendEmail({
                to: parsedInput.email,
                subject: "Your account is created",
                html: await render(EmailCreateUser({
                    password: password,
                    email: parsedInput.email,
                })),
            });

            const defaultOrganization = await db.query.organization.findFirst({
                where: eq(drizzleDb.schemas.organization.slug, "default"),
            });

            if (defaultOrganization) {
                await auth.api.addMember({
                    body: {
                        userId: newUser.id,
                        organizationId: defaultOrganization.id,
                        role: "admin",
                    },
                });
            }

            return {
                success: true,
                value: newUser,
                actionSuccess: {
                    message: "user_created",
                },
            };
        }
        return {
            success: false,
            actionError: {
                message: "user_created",
                cause: "Unknown error",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "user_created",
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});

export const updateUserAction = userAction
    .schema(
        z.object({
            id: zString(),
            name: zString().optional(),
            email: zEmail(),
        })
    )
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<{}>> => {
        try {


            const [updatedUser] = await db.update(drizzleDb.schemas.user).set(withUpdatedAt({
                name: parsedInput.name ? parsedInput.name : extractNameFromEmail(parsedInput.email),
                email: parsedInput.email,
                emailVerified: false
            })).where(eq(drizzleDb.schemas.user.id, parsedInput.id)).returning();


            if (updatedUser) {
                return {
                    success: true,
                    actionSuccess: {
                        message: "user_updated",
                    },
                };
            }

            return {
                success: false,
                actionError: {
                    message: "user_updated",
                    cause: "Unknown error",
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "user_updated",
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });

export const setSuperAdminOwnerOfOrganizationsOwnedByUser = userAction
    .schema(
        z.object({
            userId: z.string(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Organization[]>> => {
        try {
            const organizationsWhereUserIsMemberAndOwner = await db.query.member.findMany({
                where: and(eq(drizzleDb.schemas.member.role, "owner"), eq(drizzleDb.schemas.member.userId, parsedInput.userId)),
                with: {
                    organization: true,
                },
            });

            const superAdminUser = await db.query.user.findFirst();
            if (!superAdminUser) {
                return {
                    success: false,
                    actionError: {
                        message: "set_super_admin_owner_of_organizations_owned_by_user",
                        cause: "Unknown error",
                    },
                };
            }

            for (let {organization} of organizationsWhereUserIsMemberAndOwner) {
                await addMemberOrganizationAction({
                    userId: superAdminUser.id,
                    organizationId: organization.id,
                    role: "owner",
                });
            }
            const organizations = organizationsWhereUserIsMemberAndOwner.map(
                (organizationWhereUserIsMemberAndOwner) => organizationWhereUserIsMemberAndOwner.organization
            );

            return {
                success: true,
                value: organizations as unknown as Organization[],
                actionSuccess: {
                    message: "set_super_admin_owner_of_organizations_owned_by_user",
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "error_set_super_admin_owner_of_organizations_owned_by_user",
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });
