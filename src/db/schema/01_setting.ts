import {pgTable, timestamp, uuid, varchar} from "drizzle-orm/pg-core";
import {typeStorageEnum} from "./types";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {timestamps} from "@/db/schema/00_common";
import {storageChannel} from "@/db/schema/12_storage-channel";

export const setting = pgTable("settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    storage: typeStorageEnum("storage").default("local").notNull(),
    name: varchar("name", {length: 255}).unique().notNull(),
    s3EndPointUrl: varchar("s3_endpoint_url", {length: 255}),
    s3AccessKeyId: varchar("s3_access_key_id", {length: 255}),
    s3SecretAccessKey: varchar("s3_secret_access_key", {length: 255}),
    S3BucketName: varchar("s3_bucket_name", {length: 255}),
    smtpPassword: varchar("smtp_password", {length: 255}),
    smtpFrom: varchar("smtp_from", {length: 255}),
    smtpHost: varchar("smtp_host", {length: 255}),
    smtpPort: varchar("smtp_port", {length: 255}),
    smtpUser: varchar("smtp_user", {length: 255}),
    defaultStorageChannelId: uuid('default_storage_channel_id')
        .references(() => storageChannel.id, {onDelete: "set null"}),
    ...timestamps
});

export const settingSchema = createSelectSchema(setting);
export type Setting = z.infer<typeof settingSchema>;
