import {boolean, jsonb, pgEnum, pgTable, unique, uuid, varchar} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {organization} from "@/db/schema/03_organization";
import {relations} from "drizzle-orm";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";


export const providerStorageKindEnum = pgEnum('provider_storage_kind', ['local', 's3']);

export const storageChannel = pgTable('storage_channel', {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: providerStorageKindEnum('provider').notNull(),
    name: varchar('name', {length: 255}).notNull(),
    config: jsonb('config').notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    ...timestamps
});

export const organizationStorageChannel = pgTable(
    "organization_storage_channels",
    {
        organizationId: uuid('organization_id')
            .notNull()
            .references(() => organization.id, {onDelete: 'cascade'}),
        storageChannelId: uuid('storage_channel_id')
            .notNull()
            .references(() => storageChannel.id, {onDelete: 'cascade'}),
    },
    (t) => [unique().on(t.organizationId, t.storageChannelId)]
);


export const storageChannelRelations = relations(storageChannel, ({many}) => ({
    organizations: many(organizationStorageChannel),
}));

export const organizationStorageChannelRelations = relations(organizationStorageChannel, ({one}) => ({
    organization: one(organization, {
        fields: [organizationStorageChannel.organizationId],
        references: [organization.id],
    }),
    storageChannel: one(storageChannel, {
        fields: [organizationStorageChannel.storageChannelId],
        references: [storageChannel.id],
    }),
}));

export const storageChannelSchema = createSelectSchema(storageChannel);
export type StorageChannel = z.infer<typeof storageChannelSchema>;


export type StorageChannelWith = StorageChannel & {
    organizations: {
        organizationId: string;
        storageChannelId: string;
    }[];
};