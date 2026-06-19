import { sql } from "drizzle-orm";
import {
    index,
    inet,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const auditActorTypeEnum = pgEnum("audit_actor_type", [
    "user",
    "api_key",
    "agent",
    "system",
]);

export const auditOutcomeEnum = pgEnum("audit_outcome", [
    "success",
    "failure",
    "denied",
]);

export const auditEvent = pgTable(
    "audit_events",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        eventType: varchar("event_type", { length: 128 }).notNull(),
        category: varchar("category", { length: 64 }).notNull(),
        outcome: auditOutcomeEnum("outcome").notNull(),
        actorType: auditActorTypeEnum("actor_type").notNull(),
        actorId: uuid("actor_id"),
        actorName: text("actor_name"),
        actorApiKeyId: uuid("actor_api_key_id"),
        actorApiKeyName: text("actor_api_key_name"),
        organizationId: uuid("organization_id"),
        organizationName: text("organization_name"),
        targetType: varchar("target_type", { length: 64 }),
        targetId: uuid("target_id"),
        targetName: text("target_name"),
        ipAddress: inet("ip_address"),
        userAgent: text("user_agent"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .default(sql`'{}'::jsonb`)
            .notNull(),
    },
    (table) => [
        index("audit_events_created_at_idx").on(table.createdAt),
        index("audit_events_organization_created_at_idx").on(table.organizationId, table.createdAt),
        index("audit_events_category_created_at_idx").on(table.category, table.createdAt),
        index("audit_events_event_type_created_at_idx").on(table.eventType, table.createdAt),
        index("audit_events_outcome_created_at_idx").on(table.outcome, table.createdAt),
    ],
);

export const auditEventSchema = createSelectSchema(auditEvent);
export type AuditEvent = z.infer<typeof auditEventSchema>;
