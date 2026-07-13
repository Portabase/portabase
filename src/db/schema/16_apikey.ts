import {pgTable, uuid} from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const apikey = pgTable("apikey", {
    id: uuid('id').defaultRandom().primaryKey(),
    configId: t.text("config_id").notNull(),
    name: t.text("name"),
    start: t.text("start"),
    prefix: t.text("prefix"),
    key: t.text("key").notNull(),
    referenceId: t.text("reference_id").notNull(),
    refillInterval: t.integer("refill_interval"),
    refillAmount: t.integer("refill_amount"),
    lastRefillAt: t.timestamp("last_refill_at", { precision: 6, withTimezone: true }),
    enabled: t.boolean("enabled"),
    rateLimitEnabled: t.boolean("rate_limit_enabled"),
    rateLimitTimeWindow: t.integer("rate_limit_time_window"),
    rateLimitMax: t.integer("rate_limit_max"),
    requestCount: t.integer("request_count"),
    remaining: t.integer("remaining"),
    lastRequest: t.timestamp("last_request", { precision: 6, withTimezone: true }),
    expiresAt: t.timestamp("expires_at", { precision: 6, withTimezone: true }),
    createdAt: t.timestamp("created_at", { precision: 6, withTimezone: true }).notNull(),
    updatedAt: t.timestamp("updated_at", { precision: 6, withTimezone: true }).notNull(),
    permissions: t.text("permissions"),
    metadata: t.text("metadata"),
});