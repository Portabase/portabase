"use server";

import * as drizzleDb from "@/db";
import { ServerActionResult } from "@/types/action-type";
import { render } from "@react-email/render";
import { UserSchema } from "@/features/users/user.schema";
import { extractNameFromEmail } from "@/utils/name-from-email";
import { generateValidPassword } from "@/utils/password";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { Organization } from "@/db/schema/03_organization";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { zEmail, zString } from "@/lib/zod";
import { withUpdatedAt } from "@/db/utils";
import { userAction } from "@/lib/safe-actions/actions";
import { sendEmail } from "@/lib/email";
import EmailCreateUser from "@/components/emails/email-create-user";
import { SignUpUser } from "@/types/auth";
import { createUserDb } from "@/db/services/user";
import { User } from "@/db/schema/02_user";
import { env } from "@/env.mjs";
import { withAuditEvent } from "@/lib/audit/with-audit-event";

const UpdateUserRoleSchema = z.object({
  userId: zString(),
  role: z.enum(["pending", "user", "admin", "superadmin"]),
});

const DeleteUserSchema = z.object({
  userId: zString(),
});

async function assignSuperAdminToOrganizationsOwnedByUser(userId: string) {
  const organizationsWhereUserIsMemberAndOwner = await db.query.member.findMany({
    where: and(
      eq(drizzleDb.schemas.member.role, "owner"),
      eq(drizzleDb.schemas.member.userId, userId),
    ),
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
    } satisfies ServerActionResult<Organization[]>;
  }

  const requestHeaders = await headers();

  for (const { organization } of organizationsWhereUserIsMemberAndOwner) {
    await auth.api.addMember({
      body: {
        userId: superAdminUser.id,
        organizationId: organization.id,
        role: "owner",
      },
      headers: requestHeaders,
    });
  }

  return {
    success: true,
    value: organizationsWhereUserIsMemberAndOwner.map(({ organization }) => organization),
    actionSuccess: {
      message: "set_super_admin_owner_of_organizations_owned_by_user",
    },
  } satisfies ServerActionResult<Organization[]>;
}

export const createUserAction = userAction
  .schema(UserSchema)
  .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<User>> => {
    return await withAuditEvent(
      async (): Promise<ServerActionResult<User>> => {
        try {
          const isPasswordAuthEnabled = env.AUTH_EMAIL_PASSWORD_ENABLED === "true";
          let password;

          const userData: SignUpUser = {
            name: parsedInput.name || extractNameFromEmail(parsedInput.email),
            email: parsedInput.email,
            theme: "dark",
            role: "user",
            password: "",
          };

          if (isPasswordAuthEnabled) {
            password = generateValidPassword();
            userData.password = password;
          }

          const newUser = await createUserDb(userData);

          if (!newUser) {
            return {
              success: false,
              actionError: {
                message: "user_created",
                cause: "Unknown error",
              },
            };
          }

          await sendEmail({
            to: parsedInput.email,
            subject: "Your account is created",
            html: await render(
              EmailCreateUser({
                password,
                email: parsedInput.email,
              }),
            ),
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
              headers: await headers(),
            });
          }

          return {
            success: true,
            value: newUser,
            actionSuccess: {
              message: "user_created",
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
      },
      {
        eventType: "user.create",
        actor: {
          type: "user" as const,
          id: ctx.user.id,
          name: ctx.user.email,
        },
        organization: null,
        target: {
          type: "user" as const,
          id: null,
          name: parsedInput.email,
        },
        metadata: {},
        onSuccess: (result) => {
          if (!result.success) {
            return undefined;
          }

          return {
            target: {
              type: "user" as const,
              id: result.value?.id ?? null,
              name: result.value?.email ?? parsedInput.email,
            },
          };
        },
      },
    );
  });

export const updateUserAction = userAction
  .schema(
    z.object({
      id: zString(),
      name: zString().optional(),
      email: zEmail(),
    }),
  )
  .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<{}>> => {
    try {
      const [updatedUser] = await db
        .update(drizzleDb.schemas.user)
        .set(
          withUpdatedAt({
            name: parsedInput.name
              ? parsedInput.name
              : extractNameFromEmail(parsedInput.email),
            email: parsedInput.email,
            emailVerified: false,
          }),
        )
        .where(eq(drizzleDb.schemas.user.id, parsedInput.id))
        .returning();

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

export const setUserRoleAction = userAction
  .schema(UpdateUserRoleSchema)
  .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<User>> => {
    const targetUser = await db.query.user.findFirst({
      where: eq(drizzleDb.schemas.user.id, parsedInput.userId),
    });

    return await withAuditEvent(
      async (): Promise<ServerActionResult<User>> => {
        try {
          if (!targetUser) {
            return {
              success: false,
              actionError: {
                message: "user_role_updated",
                cause: "not_found",
              },
            };
          }

          const updatedUser = await auth.api.setRole({
            body: {
              userId: parsedInput.userId,
              role: parsedInput.role,
            },
            headers: await headers(),
          });

          return {
            success: true,
            value: updatedUser.user as User,
            actionSuccess: {
              message: "user_role_updated",
            },
          };
        } catch (error) {
          return {
            success: false,
            actionError: {
              message: "user_role_updated",
              cause: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      {
        eventType: "user.role_update",
        actor: {
          type: "user" as const,
          id: ctx.user.id,
          name: ctx.user.email,
        },
        organization: null,
        target: {
          type: "user" as const,
          id: targetUser?.id ?? null,
          name: targetUser?.email ?? null,
        },
        metadata: {
          oldRole: targetUser?.role ?? null,
          newRole: parsedInput.role,
        },
      },
    );
  });

export const deleteUserAction = userAction
  .schema(DeleteUserSchema)
  .action(async ({ parsedInput, ctx }): Promise<ServerActionResult<null>> => {
    const targetUser = await db.query.user.findFirst({
      where: eq(drizzleDb.schemas.user.id, parsedInput.userId),
    });

    return await withAuditEvent(
      async (): Promise<ServerActionResult<null>> => {
        try {
          if (!targetUser) {
            return {
              success: false,
              actionError: {
                message: "user_deleted",
                cause: "not_found",
              },
            };
          }

          const transferResult = await assignSuperAdminToOrganizationsOwnedByUser(parsedInput.userId);
          if (!transferResult.success) {
            return {
              success: false,
              actionError: transferResult.actionError,
            };
          }

          await auth.api.removeUser({
            body: {
              userId: parsedInput.userId,
            },
            headers: await headers(),
          });

          return {
            success: true,
            value: null,
            actionSuccess: {
              message: "user_deleted",
            },
          };
        } catch (error) {
          return {
            success: false,
            actionError: {
              message: "user_deleted",
              cause: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      {
        eventType: "user.delete",
        actor: {
          type: "user" as const,
          id: ctx.user.id,
          name: ctx.user.email,
        },
        organization: null,
        target: {
          type: "user" as const,
          id: targetUser?.id ?? null,
          name: targetUser?.email ?? null,
        },
        metadata: {},
      },
    );
  });

export const setSuperAdminOwnerOfOrganizationsOwnedByUser = userAction
  .schema(
    z.object({
      userId: z.string(),
    }),
  )
  .action(
    async ({ parsedInput }): Promise<ServerActionResult<Organization[]>> => {
      try {
        return await assignSuperAdminToOrganizationsOwnedByUser(parsedInput.userId);
      } catch (error) {
        return {
          success: false,
          actionError: {
            message:
              "error_set_super_admin_owner_of_organizations_owned_by_user",
            cause: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    },
  );
