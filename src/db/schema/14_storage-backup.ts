import {
  pgTable,
  uuid,
  text,
  pgEnum,
  bigint,
  index,
  timestamp,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schema/00_common";
import { StorageChannel, storageChannel } from "@/db/schema/12_storage-channel";
import { backup } from "@/db/schema/07_database";
import { relations, sql } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const backupStorageStatusEnum = pgEnum("backup_storage_status", [
  "pending",
  "success",
  "failed",
]);

export const backupPresenceEnum = pgEnum("backup_presence", [
  "present",
  "missing",
  "unknown",
]);

export const backupStorage = pgTable(
  "backup_storage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    backupId: uuid("backup_id")
      .notNull()
      .references(() => backup.id, { onDelete: "cascade" }),
    storageChannelId: uuid("storage_channel_id")
      .notNull()
      .references(() => storageChannel.id, { onDelete: "cascade" }),
    status: backupStorageStatusEnum("status").notNull().default("pending"),
    path: text("path"),
    size: bigint("size", { mode: "number" }),
    checksum: text("checksum"),
    presence: backupPresenceEnum("presence").notNull().default("unknown"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastCheckError: text("last_check_error"),
    ...timestamps,
  },
  (table) => [
    index("idx_backup_storage_treemap")
      .on(table.storageChannelId)
      .where(sql`status = 'success' AND size IS NOT NULL`),
    index("idx_backup_storage_presence_due")
      .on(table.presence, table.lastCheckedAt)
      .where(sql`deleted_at IS NULL AND status = 'success'`),
  ],
);

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
