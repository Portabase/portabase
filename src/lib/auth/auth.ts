import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as drizzleDb from "@/db";
import { db } from "@/db";
import { env } from "@/env.mjs";
import { nextCookies } from "better-auth/next-js";
import {
  admin as adminPlugin,
  openAPI,
  Organization,
  organization,
  twoFactor,
} from "better-auth/plugins";
import {
  ac,
  admin,
  orgAdmin,
  orgMember,
  orgOwner,
  pending,
  superadmin,
  user,
} from "@/lib/auth/permissions";
import { headers } from "next/headers";
import { count, eq } from "drizzle-orm";
import {
  MemberWithUser,
  OrganizationWithMembersAndUsers,
} from "@/db/schema/03_organization";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { withUpdatedAt } from "@/db/utils";
import EmailVerification from "@/components/emails/auth/email-verification";
import EmailForgotPassword from "@/components/emails/auth/email-forgot-password";
import { getDeviceDetails } from "@/utils/detection";
import EmailNewLogin from "@/components/emails/auth/email-new-login";
import { sso } from "@better-auth/sso";
import { SUPPORTED_PROVIDERS } from "@/lib/auth/config";
import { passkey } from "@better-auth/passkey";
import { getOidcProviders } from "./oidc";
import { APIError } from "better-auth/api";
import { getOAuthProviders } from "./oauth";

const oidcProviders = getOidcProviders();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: drizzleDb.schemas,
  }),
  appName: env.PROJECT_NAME!,
  baseURL: env.PROJECT_URL,
  secret: env.PROJECT_SECRET,
  emailAndPassword: {
    enabled: env.AUTH_EMAIL_PASSWORD_ENABLED === "true",
    requireEmailVerification: false,
    sendResetPassword: async ({ user, token }, request) => {
      if (env.AUTH_EMAIL_PASSWORD_ENABLED !== "true") {
        throw new APIError("FORBIDDEN", {
          message: "Password reset is disabled.",
        });
      }
      await db
        .update(drizzleDb.schemas.user)
        .set(
          withUpdatedAt({
            emailVerified: true,
          }),
        )
        .where(eq(drizzleDb.schemas.user.id, user.id))
        .returning();

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: await render(
          EmailForgotPassword({
            firstname: user.name!,
            token,
          }),
          {},
        ),
      });
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, token, url }) {
      await sendEmail({
        to: user.email,
        subject: "Portabase Email Verification",
        html: await render(
          EmailVerification({
            firstname: user.name,
            url: url,
          }),
        ),
      });

      await (
        await auth.$context
      ).internalAdapter.updateUser(user.id, {
        emailVerified: false,
      });
    },
    async afterEmailVerification(user) {
      await (
        await auth.$context
      ).internalAdapter.updateUser(user.id, {
        emailVerified: true,
      });
    },
  },
  socialProviders: getOAuthProviders().reduce<
    Record<string, { clientId: string; clientSecret: string }>
  >((acc, provider) => {
    const configEntry = SUPPORTED_PROVIDERS.find((p) => p.id === provider.id);

    if (!configEntry?.isActive) {
      return acc;
    }

    acc[provider.id] = {
      clientId: provider.client,
      clientSecret: provider.secret,
      ...(provider.id === "apple" && provider.appleBundleIdentifier
        ? { appBundleIdentifier: provider.appleBundleIdentifier }
        : {}),
    };
    return acc;
  }, {}),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: [
        "credential",
        ...getOAuthProviders().map((p) => p.id),
        ...oidcProviders.map((p) => p.id),
      ],
      allowDifferentEmails: true,
    },
  },

  plugins: [
    sso({
      defaultSSO: oidcProviders.map((p) => ({
        oidcConfig: {
          issuer: p.issuerUrl,
          discoveryEndpoint: p.discoveryEndpoint,
          jwksEndpoint: p.jwksEndpoint,
          clientId: p.client,
          clientSecret: p.secret,
          scopes: p.scopes?.split(" ") ?? ["openid", "profile", "email"],
          pkce: p.pkce,
          mapping: {
            extraFields: {
              groups: "groups",
            },
          },
        },
        providerId: p.id,
        domain: p.host,
        //@ts-ignore
        issuer: p.issuerUrl,
      })),
      provisionUser: async ({ user: usr, userInfo, provider }) => {
        const existingUser = await db.query.user.findFirst({
          where: eq(drizzleDb.schemas.user.email, usr.email),
        });

        if (existingUser && existingUser.role === "superadmin") {
          return;
        }

        if (existingUser && env.AUTH_SYNC_OIDC_ROLES_ON_LOGIN === "false") {
          return;
        }

        const providerId = provider.providerId;
        const oidcProvider = oidcProviders.find((p) => p.id === providerId);
        const allowedGroup = oidcProvider?.allowedGroup || env.ALLOWED_GROUP;
        const roleMapStr = oidcProvider?.roleMap;

        const rawGroups = userInfo?.groups || userInfo?.roles || [];
        const userGroups: string[] = Array.isArray(rawGroups)
          ? rawGroups
          : [rawGroups];

        let roleToAssign: string | undefined;

        if (roleMapStr) {
          const mappings = roleMapStr.split(",").map((m) => m.split(":"));
          for (const [group, role] of mappings) {
            if (userGroups.includes(group.trim())) {
              roleToAssign = role.trim();
              break;
            }
          }
        }

        if (!roleToAssign && allowedGroup) {
          const hasAccess = userGroups.includes(allowedGroup);

          if (hasAccess) {
            const userCount = (
              await db.select({ count: count() }).from(drizzleDb.schemas.user)
            )[0].count;
            const isSuperadmin = userCount === 0;

            roleToAssign =
              allowedGroup.includes("admin") ||
              allowedGroup.includes("superadmin")
                ? isSuperadmin
                  ? "superadmin"
                  : "admin"
                : "pending";
          }
        }

        if (!roleToAssign && oidcProvider?.defaultRole) {
          roleToAssign = oidcProvider.defaultRole;
        }

        if (!roleToAssign) {
          console.warn(
            `Access Denied for user ${usr.email}: No matching group/role found in ${providerId} config.`,
          );
          throw new APIError("FORBIDDEN", {
            message: `Access Denied: No matching roles found (${roleToAssign})`,
          });
        }

        const userCount = (
          await db.select({ count: count() }).from(drizzleDb.schemas.user)
        )[0].count;
        if (
          userCount === 0 &&
          (roleToAssign === "admin" || roleToAssign === "superadmin")
        ) {
          roleToAssign = "superadmin";
        }

        if (existingUser) {
          await db
            .update(drizzleDb.schemas.user)
            .set({ role: roleToAssign, emailVerified: true })
            .where(eq(drizzleDb.schemas.user.id, existingUser.id));
        } else {
          return {
            ...usr,
            role: roleToAssign,
            emailVerified: true,
          };
        }
      },
    }),
    ...(env.AUTH_PASSKEY_ENABLED === "true"
      ? [
          passkey({
            rpName: env.PROJECT_NAME || "Portabase",
            rpID: env.PROJECT_URL
              ? new URL(env.PROJECT_URL).hostname
              : "localhost",
          }),
        ]
      : []),
    openAPI(),
    nextCookies(),
    twoFactor(),
    organization({
      ac,
      roles: {
        owner: orgOwner,
        admin: orgAdmin,
        member: orgMember,
      },
    }),
    adminPlugin({
      adminRoles: ["admin", "superadmin"],
      defaultRole: "pending",
      ac,
      roles: {
        admin,
        user,
        pending,
        superadmin,
      },
    }),
  ],
  advanced: {
    database: {
      generateId: false,
    },
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: true,
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
    },
    additionalFields: {
      deletedAt: {
        type: "number",
        nullable: true,
        required: false,
      },
      theme: {
        type: "string",
      },
      lastConnectedAt: {
        type: "date",
      },
      lastChangedPasswordAt: {
        type: "date",
      },
    },
  },
  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          const provider = SUPPORTED_PROVIDERS.find(
            (p) => p.id === account.providerId,
          );

          if (provider && provider.allowLinking === false) {
            throw new APIError("FORBIDDEN", {
              message: "Linking is disabled for this provider.",
            });
          }
        },
      },
      delete: {
        before: async (account) => {
          const provider = SUPPORTED_PROVIDERS.find(
            (p) => p.id === account.providerId,
          );
          if (provider && provider.allowUnlinking === false) {
            throw new APIError("FORBIDDEN", {
              message: "Unlinking is disabled for this provider.",
            });
          }
        },
      },
    },
    user: {
      update: {
        async before(user, context) {
          if (env.AUTH_EMAIL_PASSWORD_ENABLED !== "true") {
            if (user.password || user.lastChangedPasswordAt) {
              throw new APIError("FORBIDDEN", {
                message: "Password updates are disabled",
              });
            }
          }
          return {
            data: user,
          };
        },
      },
      create: {
        async before(user, context) {
          const userCount = (
            await db.select({ count: count() }).from(drizzleDb.schemas.user)
          )[0].count;

          if (env.AUTH_SIGNUP_ENABLED !== "true" && userCount > 0) {
            throw new APIError("FORBIDDEN", {
              message: "Sign up is disabled",
            });
          }

          const role = userCount === 0 ? "superadmin" : "pending";

          return {
            data: {
              ...user,
              role,
            },
          };
        },
        async after(user, context) {
          const userCount = (
            await db.select({ count: count() }).from(drizzleDb.schemas.user)
          )[0].count;
          const role = userCount === 0 ? "owner" : "admin";

          const defaultOrgSlug = "default";
          const defaultOrg = await db.query.organization.findFirst({
            where: eq(drizzleDb.schemas.organization.slug, defaultOrgSlug),
          });

          if (defaultOrg) {
            await db.insert(drizzleDb.schemas.member).values({
              userId: user.id,
              organizationId: defaultOrg.id,
              role: role,
            });
          } else {
            console.warn(
              "Default organization not found. Cannot assign member.",
            );
          }
        },
      },
    },
    session: {
      create: {
        before: async (session, context) => {
          const userId = session.userId;

          const memberships = await db.query.member.findMany({
            where: eq(drizzleDb.schemas.member.userId, userId),
          });

          const url =
            context?.request?.url || context?.headers?.get("referer") || "";

          let providerId: string | undefined;

          if (url) {
            const urlPath = new URL(url).pathname;
            const pathParts = urlPath.split("/");
            const lastPathPart = pathParts[pathParts.length - 1];

            if (urlPath.startsWith("/api/auth/sso/callback/")) {
              providerId = lastPathPart;
            } else if (urlPath.startsWith("/api/auth/callback/")) {
              providerId = lastPathPart;
            }
          }

          return {
            data: {
              activeOrganizationId: memberships[0]?.organizationId,
              providerId: providerId,
            },
          };
        },
        after: async (session) => {
          const user = await db.query.user.findFirst({
            where: eq(drizzleDb.schemas.user.id, session.userId),
          });

          if (!user) return;

          const createdAtDiff =
            new Date(session.createdAt).getTime() -
            new Date(user.createdAt).getTime();

          if (createdAtDiff < 5000) {
            console.log(
              `Skipping new login email for freshly created user ${user.email}`,
            );
            return;
          }

          const lastDiff = user.lastConnectedAt
            ? new Date(session.createdAt).getTime() -
              new Date(user.lastConnectedAt).getTime()
            : Infinity;

          if (lastDiff < 30000) return;

          if (user.role === "pending") return;

          const deviceInfo = getDeviceDetails(session.userAgent);

          await sendEmail({
            to: user.email,
            subject: "New login to your account",
            html: await render(
              EmailNewLogin({
                firstname: user.name!,
                os: deviceInfo.os,
                browser: deviceInfo.browser,
                ipAddress: session.ipAddress!,
              }),
              {},
            ),
          });

          (await auth.$context).internalAdapter.updateUser(user.id, {
            lastConnectedAt: new Date(),
          });
        },
      },
    },
  },
  session: {
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
      },
      providerId: {
        type: "string",
        required: false,
      },
    },
  },
  /*    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    const organizationId = await getLastOrganizationOrFirst(session.userId);

                    if (!organizationId) {
                        return {
                            ...session,
                        };
                    }


                    const [aa] = await db
                        .update(drizzleUser.session)
                        .set({ activeOrganizationId: organizationId })
                        .where(eq(drizzleUser.session.id, session.id))
                        .returning();


                    return {
                        ...session,
                        activeOrganizationId: organizationId,
                    };
                },
            },
        },
    },*/
  trustedOrigins: [env.PROJECT_URL!, "http://app"],
});

/*export const signUpUser = async (email: string, password: string, name: string) => {
    const user = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        },
    });

    return user;
};

export const signInUser = async (email: string, password: string) => {
    const user = await auth.api.signInEmail({
        body: {
            email,
            password,
        },
    });

    return user;
};*/

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: "user" | "pending" | "admin" | "superadmin" = "pending",
) => {
  return await auth.api.createUser({
    headers: await headers(),
    body: {
      name,
      email,
      password,
      role,
    },
  });
};

export const getSessions = async () => {
  return await auth.api.listSessions({
    headers: await headers(),
  });
};

export const getSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
};

export const revokeSession = async (e: string) => {
  try {
    const { status } = await auth.api.revokeSession({
      body: {
        token: e,
      },
      headers: await headers(),
    });
    return status;
  } catch (e) {}
};

export const getAccounts = async () => {
  return await auth.api.listUserAccounts({
    headers: await headers(),
  });
};

export const unlinkAccount = async (provider: string, account: string) => {
  try {
    const { status } = await auth.api.unlinkAccount({
      body: {
        providerId: provider,
        accountId: account,
      },
      headers: await headers(),
    });

    return status;
  } catch (e) {}
};

export const getOrganization = async ({
  organizationId,
  organizationSlug,
}: {
  organizationId?: string;
  organizationSlug?: string;
} = {}): Promise<OrganizationWithMembersAndUsers | null> => {
  const query =
    organizationId != null
      ? { organizationId }
      : organizationSlug != null
        ? { organizationSlug }
        : undefined;

  try {
    const response = await auth.api.getFullOrganization({
      headers: await headers(),
      ...(query ? { query } : {}),
    });

    return response as OrganizationWithMembersAndUsers;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getPasskeys = async () => {
  if (env.AUTH_PASSKEY_ENABLED !== "true") return [];
  const passkeys = await auth.api.listPasskeys({
    headers: await headers(),
  });

  return passkeys;
};

export const revokePasskey = async (e: string) => {
  if (env.AUTH_PASSKEY_ENABLED !== "true") return;
  await auth.api.deletePasskey({
    body: {
      id: e,
    },
    headers: await headers(),
  });
};

export const listOrganizations = async (): Promise<Organization[] | null> => {
  try {
    return (await auth.api.listOrganizations({
      headers: await headers(),
    })) as Organization[];
  } catch (e) {
    return null;
  }
};

export const getLastOrganizationOrFirst = async (userId: string) => {
  try {
    const organizations = await db.query.organization.findMany({
      where: eq(drizzleDb.schemas.member.userId, userId),
    });

    if (organizations.length > 0) {
      return organizations[0].id;
    }

    return null;
  } catch (e) {
    return null;
  }
};

export const createOrganization = async (name: string, slug: string) => {
  try {
    return await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name,
        slug,
      },
    });
  } catch (e: any) {
    const errorMessage =
      e?.response?.data?.message || e?.message || "Unknown auth error";
    const status = e?.response?.status || 500;

    console.error("Auth API createOrganization error:", {
      message: errorMessage,
      status,
      raw: e,
    });

    throw {
      name: "AuthCreateOrganizationError",
      message: errorMessage,
      status,
      cause: e,
    };
  }
};

export const deleteOrganization = async (organizationId: string) => {
  try {
    return await auth.api.deleteOrganization({
      body: {
        organizationId,
      },
      headers: await headers(),
    });
  } catch (e: any) {
    const errorMessage =
      e?.response?.data?.message || e?.message || "Unknown auth error";
    const status = e?.response?.status || 500;

    console.error("Auth API deleteOrganization error:", {
      message: errorMessage,
      status,
      raw: e,
    });

    throw {
      name: "AuthDeleteOrganizationError",
      message: errorMessage,
      status,
      cause: e,
    };
  }
};

export const checkSlugOrganization = async (slug: string) => {
  try {
    const { status } = await auth.api.checkOrganizationSlug({
      headers: await headers(),
      body: {
        slug,
      },
    });

    return status;
  } catch {}
};

export const getActiveMember = async () => {
  try {
    const member = await auth.api.getActiveMember({
      headers: await headers(),
    });

    return member as MemberWithUser;
  } catch (e) {
    console.log("err", e);
  }
};

export const setActiveOrganization = async (slug: string) => {
  try {
    return await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationSlug: slug,
      },
    });
  } catch {}
};
