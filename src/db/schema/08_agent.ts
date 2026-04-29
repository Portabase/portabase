import {boolean, pgTable, text, timestamp, uuid, integer, unique} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {Database, database} from "@/db/schema/07_database";
import {relations} from "drizzle-orm";
import {timestamps} from "@/db/schema/00_common";
import {organization} from "@/db/schema/03_organization";

export const agent = pgTable("agents", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    version: text("version"),
    name: text("name").notNull().notNull(),
    healthErrorCount: integer("health_error_count"),
    description: text("description").notNull(),
    isArchived: boolean("is_archived").default(false),
    lastContact: timestamp("last_contact"),
    organizationId: uuid("organization_id").references(() => organization.id, {onDelete: "cascade"}),
    ...timestamps
});


export const organizationAgent = pgTable(
    "organization_agents",
    {
        organizationId: uuid('organization_id')
            .notNull()
            .references(() => organization.id, {onDelete: 'cascade'}),
        agentId: uuid('agent_id')
            .notNull()
            .references(() => agent.id, {onDelete: 'cascade'}),
        ...timestamps
    },
    (t) => [unique().on(t.organizationId, t.agentId)]

);

export const agentSchema = createSelectSchema(agent);
export type Agent = z.infer<typeof agentSchema>;


export const agentRelations = relations(agent, ({many}) => ({
    databases: many(database),
    organizations: many(organizationAgent),
}));

export const organizationAgentRelations = relations(organizationAgent, ({one}) => ({
    organization: one(organization, {
        fields: [organizationAgent.organizationId],
        references: [organization.id],
    }),
    agent: one(agent, {
        fields: [organizationAgent.agentId],
        references: [agent.id],
    }),
}));


export type AgentWith = Agent & {
    databases?: Database[] | null;
    organizations: {
        organizationId: string;
        agentId: string;
    }[];
};

export type AgentWithDatabases = Agent & {
    databases: Database[] | [];
};

