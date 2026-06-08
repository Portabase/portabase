import {pgTable, uuid, text, integer, pgEnum, bigint, timestamp} from "drizzle-orm/pg-core";
import {timestamps} from "@/db/schema/00_common";
import {backup, restoration} from "@/db/schema/07_database";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {relations} from "drizzle-orm";


export const jobLogLevelEnum = pgEnum("job_log_level", [
    "debug",
    "info",
    "warn",
    "error",
]);

export const jobLogEntryTypeEnum = pgEnum("job_log_entry_type", [
    "log",
    "command",
]);

export const jobLog = pgTable(
    "job_log",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        backupId: uuid("backup_id").references(() => backup.id, {
            onDelete: "cascade",
        }),

        restorationId: uuid("restoration_id").references(() => restoration.id, {
            onDelete: "cascade",
        }),

        loggedAt: timestamp("logged_at", {withTimezone: true}).notNull(),

        entryType: jobLogEntryTypeEnum("entry_type").notNull(),
        level: jobLogLevelEnum("level").notNull(),

        message: text("message").notNull(),


        command: text("command"),
        output: text("output"),
        exitCode: integer("exit_code"),
        durationMs: bigint("duration_ms", {mode: "number"}),

        ...timestamps,
    },
);


export const jobLogRelations = relations(jobLog, ({one}) => ({
    backup: one(backup, {
        fields: [jobLog.backupId],
        references: [backup.id],
    }),

    restoration: one(restoration, {
        fields: [jobLog.restorationId],
        references: [restoration.id],
    }),
}));
export const jobLogSchema = createSelectSchema(jobLog);
export type JobLog = z.infer<typeof jobLogSchema>;


