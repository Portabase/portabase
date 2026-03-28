import {pgTable, uuid, timestamp, pgEnum} from 'drizzle-orm/pg-core';
import {timestamps} from "@/db/schema/00_common";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const healthcheckKindEnum = pgEnum('healthcheck_kind', ['database', 'agent']);
export const healthCheckStatusEnum = pgEnum('healthcheck_status', ['success', 'failed']);


export const healthcheckLog = pgTable('healthcheck_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: healthcheckKindEnum('kind').notNull(),
    date: timestamp("date").notNull(),
    status: healthCheckStatusEnum("status").notNull(),
    objectId: uuid('object_id').notNull(),
    ...timestamps
});

export const healthcheckLogSchema = createSelectSchema(healthcheckLog);
export type HealthcheckLog = z.infer<typeof healthcheckLogSchema>;

export type HealthcheckKind = (typeof healthcheckKindEnum.enumValues)[number];
export type HealthcheckStatus = (typeof healthCheckStatusEnum.enumValues)[number];
