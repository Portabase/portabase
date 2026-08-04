import {pgTable, text, boolean, uuid} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
import {Organization, organization} from "./03_organization";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {Database, database, DatabaseWith, RetentionPolicy, retentionPolicy} from "./07_database";
import {timestamps} from "@/db/schema/00_common";
import {AlertPolicy, alertPolicy} from "@/db/schema/10_alert-policy";
import {StoragePolicy, storagePolicy} from "@/db/schema/13_storage-policy";

export const project = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull().notNull(),
    isArchived: boolean("is_archived").default(false),
    backupPolicy: text("backup_policy"),
    organizationId: uuid("organization_id")
        .notNull()
        .references(() => organization.id, {onDelete: "cascade"}),
    ...timestamps
});

export const projectRelations = relations(project, ({one, many}) => ({
    organization: one(organization, {
        fields: [project.organizationId],
        references: [organization.id],
    }),
    databases: many(database),
    storagePolicies: many(storagePolicy),
    alertPolicies: many(alertPolicy),
    retentionPolicy: one(retentionPolicy, {
        fields: [project.id],
        references: [retentionPolicy.projectId],
    }),
}));

export const projectSchema = createSelectSchema(project);
export type Project = z.infer<typeof projectSchema>;

export type ProjectWith = Project & {
    databases: Database[];
    organization: Organization;
};

export type ProjectWithDatabasesAndBackups = Project & {
    databases: DatabaseWith[];
    organization: Organization;
};

export type ProjectWithPolicies = Project & {
    storagePolicies?: StoragePolicy[];
    alertPolicies?: AlertPolicy[];
    retentionPolicy?: RetentionPolicy | null;
};

