import {pgTable, text, boolean, timestamp, uuid, integer, pgEnum} from "drizzle-orm/pg-core";
import {Agent, agent} from "./08_agent";
import {Project, project} from "./06_project";
import {relations} from "drizzle-orm";
import {dbmsEnum, statusEnum} from "./types";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {timestamps} from "@/db/schema/00_common";
import {AlertPolicy, alertPolicy} from "@/db/schema/10_alert-policy";
import {StoragePolicy, storagePolicy} from "@/db/schema/13_storage-policy";
import {backupStorage} from "@/db/schema/14_storage-backup";

export const database = pgTable("databases", {
    id: uuid("id").primaryKey().defaultRandom(),
    agentDatabaseId: uuid("agent_database_id").notNull().defaultRandom(),
    name: text("name").notNull(),
    dbms: dbmsEnum("dbms").notNull(),
    description: text("description"),
    backupPolicy: text("backup_policy"),
    isWaitingForBackup: boolean("is_waiting_for_backup").default(false).notNull(),
    backupToRestore: text("backup_to_restore"),
    agentId: uuid("agent_id")
        .notNull()
        .references(() => agent.id, {onDelete: "cascade"}),
    lastContact: timestamp("last_contact"),
    projectId: uuid("project_id")
        .references(() => project.id),
    ...timestamps

});


export const backup = pgTable(
    "backups",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        status: statusEnum("status").default("waiting").notNull(),
        file: text("file"),
        fileSize: integer("file_size"),
        databaseId: uuid("database_id")
            .notNull()
            .references(() => database.id, {onDelete: "cascade"}),
        ...timestamps
    },
);

export const retentionPolicyType = pgEnum("retention_policy_type", ["count", "days", "gfs"]);

export const retentionPolicy = pgTable("retention_policies", {
    id: uuid("id").primaryKey().defaultRandom(),
    databaseId: uuid("database_id").notNull().references(() => database.id, {onDelete: "cascade"}),
    type: retentionPolicyType("type").notNull(),
    count: integer("count").default(7),   // for "count"
    days: integer("days").default(30),    // for "days"
    gfsDaily: integer("gfs_daily").default(7),
    gfsWeekly: integer("gfs_weekly").default(4),
    gfsMonthly: integer("gfs_monthly").default(12),
    gfsYearly: integer("gfs_yearly").default(3),
    ...timestamps
});


export const restoration = pgTable("restorations", {
    id: uuid("id").primaryKey().defaultRandom(),
    status: statusEnum("status").default("waiting").notNull(),
    backupId: uuid("backup_id")
        .notNull()
        .references(() => backup.id, {onDelete: "cascade"}),
    databaseId: uuid("database_id").references(() => database.id, {onDelete: "cascade"}),
    ...timestamps

});

export const databaseRelations = relations(database, ({one, many}) => ({
    retentionPolicy: one(retentionPolicy, {
        fields: [database.id],
        references: [retentionPolicy.databaseId],
    }),
    agent: one(agent, {fields: [database.agentId], references: [agent.id]}),
    project: one(project, {fields: [database.projectId], references: [project.id]}),
    backups: many(backup),
    restorations: many(restoration),
    alertPolicies: many(alertPolicy),
    storagePolicies: many(storagePolicy),
}));

export const backupRelations = relations(backup, ({one, many}) => ({
    database: one(database, {fields: [backup.databaseId], references: [database.id]}),
    restorations: many(restoration),
    storages: many(backupStorage),
}));

export const restorationRelations = relations(restoration, ({one}) => ({
    backup: one(backup, {fields: [restoration.backupId], references: [backup.id]}),
    database: one(database, {fields: [restoration.databaseId], references: [database.id]}),
}));


export const retentionPolicyRelations = relations(retentionPolicy, ({one}) => ({
    database: one(database, {
        fields: [retentionPolicy.databaseId],
        references: [database.id],
    }),
}));

export const databaseSchema = createSelectSchema(database);
export type Database = z.infer<typeof databaseSchema>;

export const backupSchema = createSelectSchema(backup);
export type Backup = z.infer<typeof backupSchema>;

export const restorationSchema = createSelectSchema(restoration);
export type Restoration = z.infer<typeof restorationSchema>;

export const retentionPolicySchema = createSelectSchema(retentionPolicy);
export type RetentionPolicy = z.infer<typeof retentionPolicySchema>;


export type DatabaseWith = Database & {
    agent?: Agent | null;
    project?: Project | null;
    backups?: Backup[] | null;
    restorations?: Restoration[] | null;
    retentionPolicy?: RetentionPolicy | null;
    alertPolicies?: AlertPolicy[] | null;
    storagePolicies?: StoragePolicy[] | null;
};

