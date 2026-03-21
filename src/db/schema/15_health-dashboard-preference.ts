import {boolean, pgTable, uuid} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {database} from "@/db/schema/07_database";
import {user} from "@/db/schema/02_user";
import {relations} from "drizzle-orm";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const healthDashboardPreference = pgTable('health_dashboard_preference', {
    id: uuid('id').defaultRandom().primaryKey(),
    databaseId: uuid('database_id')
        .notNull()
        .references(() => database.id, {onDelete: 'cascade'}),
    userId: uuid('user_id')
        .notNull()
        .references(() => user.id, {onDelete: 'cascade'}),
    visible: boolean('visible').default(false).notNull(),
    ...timestamps,
});

export const healthDashboardPreferenceRelations = relations(healthDashboardPreference, ({one}) => ({
    database: one(database, {
        fields: [healthDashboardPreference.databaseId],
        references: [database.id],
    }),
    user: one(user, {
        fields: [healthDashboardPreference.userId],
        references: [user.id],
    }),
}));

export const healthDashboardPreferenceSchema = createSelectSchema(healthDashboardPreference);
export type HealthDashboardPreference = z.infer<typeof healthDashboardPreferenceSchema>;
