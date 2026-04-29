import {NextResponse} from "next/server";
import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {logger} from "@/lib/logger";

const log = logger.child({module: "api/agent/backup/helpers"});

export function withAgentCheck(handler: Function) {
    return async (request: Request, context: { params: Promise<{ agentId: string }> }) => {
        try {
            const agentId = (await context.params).agentId;

            const agent = await db.query.agent.findFirst({
                where: and(eq(drizzleDb.schemas.agent.id, agentId), eq(drizzleDb.schemas.agent.isArchived, false)),
            });

            if (!agent) {
                return NextResponse.json(
                    {error: "Agent not found"},
                    {status: 404}
                );
            }

            return handler(request, {...context, agent});
        } catch (err) {
            log.error({error: err, name: "withAgentCheck"}, "Error in agent middleware");
            return NextResponse.json(
                {error: "Internal server error"},
                {status: 500}
            );
        }
    };
}

export async function getDatabaseOrThrow(generatedId: string) {
    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.agentDatabaseId, generatedId),
        with: {
            project: true,
            alertPolicies: true,
            storagePolicies: true
        }
    });

    if (!database) {
        throw NextResponse.json(
            {error: "Database associated with generatedId not found"},
            {status: 404}
        );
    }

    return database;
}