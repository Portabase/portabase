import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {env} from "@/env.mjs";
import {nextCookies} from "better-auth/next-js";
import {admin as adminPlugin, openAPI, Organization, organization, twoFactor} from "better-auth/plugins";
import {ac, admin, orgAdmin, orgMember, orgOwner, pending, superadmin, user} from "@/lib/auth/permissions";
import {headers} from "next/headers";
import {count, eq} from "drizzle-orm";
import {MemberWithUser, OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {sendEmail} from "@/lib/email/email-helper";
import {render} from "@react-email/render";
import {SUPPORTED_PROVIDERS} from "../../../portabase.config";
import {withUpdatedAt} from "@/db/utils";
import EmailVerification from "@/components/emails/auth/email-verification";
import EmailForgotPassword from "@/components/emails/auth/email-forgot-password";
import {getDeviceDetails} from "@/utils/detection";
import EmailNewLogin from "@/components/emails/auth/email-new-login";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: drizzleDb.schemas,
    }),
    appName: env.PROJECT_NAME!,
    baseURL: env.PROJECT_URL,
    secret: env.PROJECT_SECRET,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        sendResetPassword: async ({user, token}, request) => {

            const [updatedUser] = await db.update(drizzleDb.schemas.user).set(withUpdatedAt({
                emailVerified: true,
            })).where(eq(drizzleDb.schemas.user.id, user.id)).returning();

            await sendEmail({
                to: user.email,
                subject: "Reset your password",
                html: await render(
                    EmailForgotPassword({
                        firstname: user.name!,
                        token,
                    }),
                    {}
                ),
            });

        },
        onPasswordReset: async ({user}, request) => {
            console.log(`Password for user ${user.email} has been reset.`);
        },
    },
    emailVerification: {
        async sendVerificationEmail({user, token, url}) {


            await sendEmail({
                to: user.email,
                subject: "Portabase Email Verification",
                html: await render(EmailVerification({
                    firstname: user.name,
                    url: url
                })),
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
    socialProviders: SUPPORTED_PROVIDERS.reduce((acc: any, provider: any) => {
        if (provider.id === "credential") return acc;
        if (provider.id === "google") {
            acc.google = {
                clientId: env.AUTH_GOOGLE_ID! as string,
                clientSecret: env.AUTH_GOOGLE_SECRET! as string,
            };
        }
        return acc;
    }, {}),
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github", "credential"],
            allowDifferentEmails: false
        },
    },

    plugins: [
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
        user: {
            create: {
                async before(user, context) {
                    const userCount = (await db.select({count: count()}).from(drizzleDb.schemas.user))[0].count;
                    const role = userCount === 0 ? "superadmin" : "pending";
                    // const role =  "admin";
                    return {
                        data: {
                            ...user,
                            role,
                        },
                    };
                },
                async after(user, context) {
                    const userCount = (await db.select({count: count()}).from(drizzleDb.schemas.user))[0].count;
                    const role = userCount === 0 ? "owner" : "admin";


                    const defaultOrgSlug = "default"; // change this if your default org has a different slug
                    const defaultOrg = await db.query.organization.findFirst({
                        where: eq(drizzleDb.schemas.organization.slug, defaultOrgSlug),
                    });

                    if (defaultOrg) {
                        console.log(user)
                        await db.insert(drizzleDb.schemas.member).values({
                            userId: user.id,
                            organizationId: defaultOrg.id,
                            role: role,
                        });
                    } else {
                        console.warn("Default organization not found. Cannot assign member.");
                    }
                },
            },
        },
        session: {
            create: {
                before: async (session, context) => {
                    const userId = session.userId;

                    let memberships = await db.query.member.findMany({
                        where: eq(drizzleDb.schemas.member.userId, userId),
                    });

                    return {
                        data: {
                            activeOrganizationId: memberships[0].organizationId,
                        },
                    };
                },
                // after: async (session) => {
                //     const user = await db.query.user.findFirst({
                //         where: eq(drizzleDb.schemas.user.id, session.userId),
                //     });
                //
                //     if (user && user.role != "pending") {
                //         const deviceInfo = getDeviceDetails(session.userAgent);
                //         await sendEmail({
                //             to: user.email,
                //             subject: "New login to your account",
                //             html: await render(
                //                 EmailNewLogin({
                //                     firstname: user.name!,
                //                     os: deviceInfo.os,
                //                     browser: deviceInfo.browser,
                //                     ipAddress: session.ipAddress!,
                //                 }),
                //                 {}
                //             ),
                //         });
                //
                //         (await auth.$context).internalAdapter.updateUser(user.id, {
                //             lastConnectedAt: new Date(),
                //         });
                //     }
                // },
                after: async (session) => {
                    const user = await db.query.user.findFirst({
                        where: eq(drizzleDb.schemas.user.id, session.userId),
                    });

                    if (!user) return;

                    const createdAtDiff = new Date(session.createdAt).getTime() - new Date(user.createdAt).getTime();

                    if (createdAtDiff < 5000) {
                        console.log(`Skipping new login email for freshly created user ${user.email}`);
                        return;
                    }

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
                            {}
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

                    console.log("sessionId", session.id);

                    const [aa] = await db
                        .update(drizzleUser.session)
                        .set({ activeOrganizationId: organizationId })
                        .where(eq(drizzleUser.session.id, session.id))
                        .returning();

                    console.log("aaaaa", aa);

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

export const createUser = async (name: string, email: string, password: string, role: "user" | "pending" | "admin" | "superadmin" = "pending") => {
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
        const {status} = await auth.api.revokeSession({
            body: {
                token: e,
            },
            headers: await headers(),
        });
        return status;
    } catch (e) {
    }
};

export const getAccounts = async () => {
    return await auth.api.listUserAccounts({
        headers: await headers(),
    });
};

export const unlinkAccount = async (provider: string, account: string) => {
    try {
        const {status} = await auth.api.unlinkAccount({
            body: {
                providerId: provider,
                accountId: account,
            },
            headers: await headers(),
        });

        return status;
    } catch (e) {
    }
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
            ? {organizationId}
            : organizationSlug != null
                ? {organizationSlug}
                : undefined;

    try {
        const response = await auth.api.getFullOrganization({
            headers: await headers(),
            ...(query ? {query} : {}),
        });

        return response as OrganizationWithMembersAndUsers;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const listOrganizations = async (): Promise<Organization[] | null> => {
    try {
        return await auth.api.listOrganizations({
            headers: await headers(),
        }) as Organization[];
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
        const errorMessage = e?.response?.data?.message || e?.message || "Unknown auth error";
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
        const errorMessage = e?.response?.data?.message || e?.message || "Unknown auth error";
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
        const {status} = await auth.api.checkOrganizationSlug({
            headers: await headers(),
            body: {
                slug,
            },
        });

        return status;
    } catch (e) {
        console.log("err", e);
    }
};

export const getActiveMember = async () => {
    try {
        const member = await auth.api.getActiveMember({
            headers: await headers(),
        });
        console.log(member);

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
    } catch (e) {
        console.log("error", e);
    }
};
