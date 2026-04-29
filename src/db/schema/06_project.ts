import {pgTable, text, boolean, uuid} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
import {Organization, organization} from "./03_organization";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {Database, database, DatabaseWith} from "./07_database";
import {timestamps} from "@/db/schema/00_common";

export const project = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull().notNull(),
    isArchived: boolean("is_archived").default(false),
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

