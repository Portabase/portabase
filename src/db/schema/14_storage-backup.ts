import { pgTable, uuid, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schema/00_common";
import {StorageChannel, storageChannel} from "@/db/schema/12_storage-channel";
import {Backup, backup, Restoration} from "@/db/schema/07_database";
import {relations} from "drizzle-orm";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const backupStorageStatusEnum = pgEnum("backup_storage_status", [
    "pending",
    "success",
    "failed",
]);

export const backupStorage = pgTable("backup_storage", {
    id: uuid("id").primaryKey().defaultRandom(),
    backupId: uuid("backup_id")
        .notNull()
        .references(() => backup.id, { onDelete: "cascade" }),
    storageChannelId: uuid("storage_channel_id")
        .notNull()
        .references(() => storageChannel.id, { onDelete: "cascade" }),
    status: backupStorageStatusEnum("status").notNull().default("pending"),
    path: text("path"),
    size: integer("size"),
    checksum: text("checksum"),
    ...timestamps,
});


export const backupStorageRelations = relations(backupStorage, ({ one }) => ({
    backup: one(backup, {
        fields: [backupStorage.backupId],
        references: [backup.id],
    }),
    storageChannel: one(storageChannel, {
        fields: [backupStorage.storageChannelId],
        references: [storageChannel.id],
    }),
}));


export const backupStorageSchema = createSelectSchema(backupStorage);
export type BackupStorage = z.infer<typeof backupStorageSchema>;

export type BackupStorageWith = BackupStorage & {
    storageChannel?: StorageChannel | null;
};


