import {boolean, pgTable, uuid, check} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {relations, sql} from "drizzle-orm";
import {database} from "@/db/schema/07_database";
import {project} from "@/db/schema/06_project";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {StorageChannel, storageChannel} from "@/db/schema/12_storage-channel";

export const storagePolicy = pgTable('storage_policy', {
    id: uuid('id').defaultRandom().primaryKey(),
    storageChannelId: uuid('storage_channel_id')
        .notNull()
        .references(() => storageChannel.id, {onDelete: 'cascade'}),
    enabled: boolean('enabled').default(true).notNull(),
    databaseId: uuid('database_id')
        .references(() => database.id, {onDelete: 'cascade'}),
    projectId: uuid('project_id')
        .references(() => project.id, {onDelete: 'cascade'}),
    ...timestamps
}, (table) => [
    check('storage_policy_owner_xor', sql`num_nonnulls(${table.databaseId}, ${table.projectId}) = 1`),
]);

export const storagePolicyRelations = relations(storagePolicy, ({one}) => ({
    storageChannel: one(storageChannel, {
        fields: [storagePolicy.storageChannelId],
        references: [storageChannel.id],
    }),
    database: one(database, {
        fields: [storagePolicy.databaseId],
        references: [database.id],
    }),
    project: one(project, {
        fields: [storagePolicy.projectId],
        references: [project.id],
    }),
}));

export const storagePolicySchema = createSelectSchema(storagePolicy);
export type StoragePolicy = z.infer<typeof storagePolicySchema>;


export type StoragePolicyWith = StoragePolicy & {
    storageChannel: StorageChannel;
};
