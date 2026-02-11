import {boolean, pgTable, uuid} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {relations} from "drizzle-orm";
import {Backup, Database, database, Restoration, RetentionPolicy} from "@/db/schema/07_database";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {StorageChannel, storageChannel} from "@/db/schema/12_storage-channel";
import {Agent} from "@/db/schema/08_agent";
import {Project} from "@/db/schema/06_project";
import {AlertPolicy} from "@/db/schema/10_alert-policy";

export const storagePolicy = pgTable('storage_policy', {
    id: uuid('id').defaultRandom().primaryKey(),
    storageChannelId: uuid('storage_channel_id')
        .notNull()
        .references(() => storageChannel.id, {onDelete: 'cascade'}),
    enabled: boolean('enabled').default(true).notNull(),
    databaseId: uuid('database_id')
        .notNull()
        .references(() => database.id, {onDelete: 'cascade'}),
    ...timestamps
});

export const storagePolicyRelations = relations(storagePolicy, ({one}) => ({
    storageChannel: one(storageChannel, {
        fields: [storagePolicy.storageChannelId],
        references: [storageChannel.id],
    }),
    database: one(database, {
        fields: [storagePolicy.databaseId],
        references: [database.id],
    }),
}));

export const storagePolicySchema = createSelectSchema(storagePolicy);
export type StoragePolicy = z.infer<typeof storagePolicySchema>;


export type StoragePolicyWith = StoragePolicy & {
    storageChannel: StorageChannel;
};
