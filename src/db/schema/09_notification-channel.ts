import {boolean, jsonb, pgEnum, pgTable, primaryKey, unique, uuid, varchar} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {MemberWithUser, Organization, organization} from "@/db/schema/03_organization";
import {relations} from "drizzle-orm";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {OrganizationInvitation} from "@/db/schema/05_invitation";


export const providerKindEnum = pgEnum('provider_kind', ['slack', 'smtp', 'discord', 'telegram', 'gotify', 'ntfy', 'webhook']);

export const notificationChannel = pgTable('notification_channel', {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: providerKindEnum('provider').notNull(),
    organizationId: uuid("organization_id").references(() => organization.id, {onDelete: "cascade"}),
    name: varchar('name', {length: 255}).notNull(),
    config: jsonb('config').notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    ...timestamps
});

export const organizationNotificationChannel = pgTable(
    "organization_notification_channels",
    {
        organizationId: uuid('organization_id')
            .notNull()
            .references(() => organization.id, {onDelete: 'cascade'}),
        notificationChannelId: uuid('notification_channel_id')
            .notNull()
            .references(() => notificationChannel.id, {onDelete: 'cascade'}),
    },
    (t) => [unique().on(t.organizationId, t.notificationChannelId)]
);


export const notificationChannelRelations = relations(notificationChannel, ({many}) => ({
    organizations: many(organizationNotificationChannel),
}));

export const organizationNotificationChannelRelations = relations(organizationNotificationChannel, ({one}) => ({
    organization: one(organization, {
        fields: [organizationNotificationChannel.organizationId],
        references: [organization.id],
    }),
    notificationChannel: one(notificationChannel, {
        fields: [organizationNotificationChannel.notificationChannelId],
        references: [notificationChannel.id],
    }),
}));

export const notificationChannelSchema = createSelectSchema(notificationChannel);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;


export type NotificationChannelWith = NotificationChannel & {
    organizations: {
        organizationId: string;
        notificationChannelId: string;
    }[];
};