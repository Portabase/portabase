import {boolean, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";
import {Database, database} from "@/db/schema/07_database";
import {relations} from "drizzle-orm";
import {timestamps} from "@/db/schema/00_common";

export const agent = pgTable("agents", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    version: text("version"),
    name: text("name").notNull().notNull(),
    description: text("description").notNull(),
    isArchived: boolean("is_archived").default(false),
    lastContact: timestamp("last_contact"),
    ...timestamps
});

export const agentSchema = createSelectSchema(agent);
export type Agent = z.infer<typeof agentSchema>;


export const agentRelations = relations(agent, ({many}) => ({
    databases: many(database),
}));


export type AgentWith = Agent & {
    databases?: Database[] | null;
};

export type AgentWithDatabases = Agent & {
    databases: Database[] | [];
};
