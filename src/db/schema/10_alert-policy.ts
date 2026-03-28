import {boolean, pgEnum, pgTable, uuid} from "drizzle-orm/pg-core";
import {notificationChannel} from "@/db/schema/09_notification-channel";
import {timestamps} from "@/db/schema/00_common";
import {relations} from "drizzle-orm";
import {database} from "@/db/schema/07_database";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const eventKindEnum = pgEnum('event_kind', ['error_backup', 'error_restore', 'success_restore', 'success_backup', 'weekly_report']);

export const alertPolicy = pgTable('alert_policy', {
    id: uuid('id').defaultRandom().primaryKey(),
    notificationChannelId: uuid('notification_channel_id')
        .notNull()
        .references(() => notificationChannel.id, {onDelete: 'cascade'}),
    eventKinds: eventKindEnum("event_kind").array().notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    databaseId: uuid('database_id')
        .notNull()
        .references(() => database.id, { onDelete: 'cascade' }),
    ...timestamps
});

export const alertPolicyRelations = relations(alertPolicy, ({one}) => ({
    notificationChannel: one(notificationChannel, {
        fields: [alertPolicy.notificationChannelId],
        references: [notificationChannel.id],
    }),
    database: one(database, {
        fields: [alertPolicy.databaseId],
        references: [database.id],
    }),
}));




export const alertPolicySchema = createSelectSchema(alertPolicy);
export type AlertPolicy = z.infer<typeof alertPolicySchema>;
