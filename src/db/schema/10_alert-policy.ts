import {boolean, pgEnum, pgTable, uuid, check} from "drizzle-orm/pg-core";
import {notificationChannel} from "@/db/schema/09_notification-channel";
import {timestamps} from "@/db/schema/00_common";
import {relations, sql} from "drizzle-orm";
import {database} from "@/db/schema/07_database";
import {project} from "@/db/schema/06_project";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const eventKindEnum = pgEnum('event_kind', ['error_backup', 'error_restore', 'success_restore', 'success_backup', 'weekly_report', 'error_health_agent', 'error_health_database', 'error_backup_missing', 'success_backup_recovered']);

export const alertPolicy = pgTable('alert_policy', {
    id: uuid('id').defaultRandom().primaryKey(),
    notificationChannelId: uuid('notification_channel_id')
        .notNull()
        .references(() => notificationChannel.id, {onDelete: 'cascade'}),
    eventKinds: eventKindEnum("event_kind").array().notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    databaseId: uuid('database_id')
        .references(() => database.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
        .references(() => project.id, { onDelete: 'cascade' }),
    ...timestamps
}, (table) => [
    check('alert_policy_owner_xor', sql`num_nonnulls(${table.databaseId}, ${table.projectId}) = 1`),
]);

export const alertPolicyRelations = relations(alertPolicy, ({one}) => ({
    notificationChannel: one(notificationChannel, {
        fields: [alertPolicy.notificationChannelId],
        references: [notificationChannel.id],
    }),
    database: one(database, {
        fields: [alertPolicy.databaseId],
        references: [database.id],
    }),
    project: one(project, {
        fields: [alertPolicy.projectId],
        references: [project.id],
    }),
}));




export const alertPolicySchema = createSelectSchema(alertPolicy);
export type AlertPolicy = z.infer<typeof alertPolicySchema>;
