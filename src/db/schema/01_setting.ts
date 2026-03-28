import {boolean, pgTable, timestamp, uuid, varchar} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {timestamps} from "@/db/schema/00_common";
import {storageChannel} from "@/db/schema/12_storage-channel";
import {relations} from "drizzle-orm";


export const setting = pgTable("settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", {length: 255}).unique().notNull(),
    smtpPassword: varchar("smtp_password", {length: 255}),
    smtpFrom: varchar("smtp_from", {length: 255}),
    smtpHost: varchar("smtp_host", {length: 255}),
    smtpPort: varchar("smtp_port", {length: 255}),
    smtpUser: varchar("smtp_user", {length: 255}),
    smtpSecure: boolean("smtp_secure"),
    defaultStorageChannelId: uuid('default_storage_channel_id')
        .references(() => storageChannel.id, {onDelete: "set null"}),
    encryption: boolean("encryption").default(false),
    ...timestamps
});

export const settingRelations = relations(setting, ({one, many}) => ({
    storageChannel: one(storageChannel, {fields: [setting.defaultStorageChannelId], references: [storageChannel.id]}),
}));


export const settingSchema = createSelectSchema(setting);
export type Setting = z.infer<typeof settingSchema>;
