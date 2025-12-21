import {relations} from "drizzle-orm";
import {boolean, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {project} from "./06_project";
import {member, OrganizationMember} from "@/db/schema/04_member";
import {invitation} from "@/db/schema/05_invitation";
import {organization} from "@/db/schema/03_organization";
import {Account as BetterAuthAccount} from "better-auth";
import {timestamps} from "@/db/schema/00_common";

export const user = pgTable("user", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role"),
    banned: boolean("banned"),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    lastChangedPasswordAt: timestamp(),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    ...timestamps
});

export const session = pgTable("session", {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    impersonatedBy: text("impersonated_by"), //id or name ????
    activeOrganizationId: text("active_organization_id"),
    ...timestamps

});

export const account = pgTable("account", {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    ...timestamps

});

export const verification = pgTable("verification", {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ...timestamps

});

export const userRelations = relations(user, ({many}) => ({
    sessions: many(session),
    accounts: many(account),
    memberships: many(member),
    invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({one}) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({one}) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const projectRelations = relations(project, ({one}) => ({
    organization: one(organization, {
        fields: [project.organizationId],
        references: [organization.id],
    }),
}));

export const userSchema = createSelectSchema(user);
export type User = z.infer<typeof userSchema>;

export const sessionSchema = createSelectSchema(session);
export type Session = z.infer<typeof sessionSchema>;

export const accountSchema = createSelectSchema(account);
export type Account = z.infer<typeof accountSchema>;


type FixedAccount = Omit<BetterAuthAccount, 'updatedAt'> & {
    updatedAt: Date | null;
};

export type UserWithAccounts = User & {
    accounts: FixedAccount[];
};