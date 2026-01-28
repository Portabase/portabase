"use server";
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {AgentSchema} from "@/features/agents/agents.schema";
import {z} from "zod";
import {eq, and, ne, count} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {slugify} from "@/utils/slugify";

const verifySlugUniqueness = async (slug: string, agentId?: string) => {
    const conditions = agentId ? and(eq(drizzleDb.schemas.agent.slug, slug), ne(drizzleDb.schemas.agent.id, agentId)) : eq(drizzleDb.schemas.agent.slug, slug);

    const [countResult] = await db.select({count: count()}).from(drizzleDb.schemas.agent).where(conditions);

    if (countResult.count > 0) {
        throw new ActionError("Slug already exists");
    }
};

export const createAgentAction = userAction.schema(AgentSchema).action(async ({parsedInput}) => {
    const slug = slugify(parsedInput.name);
    await verifySlugUniqueness(slug);
    const [createdAgent] = await db.insert(drizzleDb.schemas.agent).values({...parsedInput, slug: slug}).returning();
    return {
        data: createdAgent,
    };
});

export const updateAgentAction = userAction
    .schema(
        z.object({
            id: z.string(),
            data: AgentSchema,
        })
    )
    .action(async ({parsedInput}) => {
        const slug = slugify(parsedInput.data.name);
        await verifySlugUniqueness(slug, parsedInput.id);

        const [updatedAgent] = await db.update(drizzleDb.schemas.agent).set({
            ...parsedInput.data,
            slug: slug
        }).where(eq(drizzleDb.schemas.agent.id, parsedInput.id)).returning();

        return {
            data: updatedAgent,
        };
    });
