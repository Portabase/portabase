import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as drizzleDb from "@/db";

export function withAgentCheck(handler: Function) {
    return async (request: Request, context: { params: Promise<{ agentId: string }> }) => {
        try {
            const agentId = (await context.params).agentId;

            const agent = await db.query.agent.findFirst({
                where: eq(drizzleDb.schemas.agent.id, agentId),
            });

            if (!agent) {
                return NextResponse.json(
                    { error: "Agent not found" },
                    { status: 404 }
                );
            }

            return handler(request, { ...context, agent });
        } catch (err) {
            console.error("Error in agent middleware:", err);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
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
            { error: "Database associated with generatedId not found" },
            { status: 404 }
        );
    }

    return database;
}