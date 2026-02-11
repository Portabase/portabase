import {NextResponse} from "next/server";
import {handleDatabases} from "./helpers";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {EDbmsSchema} from "@/db/schema/types";
import {eq} from "drizzle-orm";
import {isUuidv4} from "@/utils/verify-uuid";
import {withUpdatedAt} from "@/db/utils";
import {eventEmitter} from "@/features/shared/event";

export type databaseAgent = {
    name: string,
    dbms: EDbmsSchema,
    generatedId: string
}

export type Body = {
    version: string,
    databases: databaseAgent[]
}


export async function POST(
    request: Request,
    {params}: { params: Promise<{ agentId: string }> }
) {
    try {
        const agentId = (await params).agentId
        console.log(agentId)
        const body: Body = await request.json();
        const lastContact = new Date();
        let message: string

        if (!isUuidv4(agentId)) {
            message = "agentId is not a valid uuid"
            console.error(message)
            return NextResponse.json(
                {error: "agentId is not a valid uuid"},
                {status: 500}
            );
        }

        const agent = await db.query.agent.findFirst({
            where: eq(drizzleDb.schemas.agent.id, agentId),
        })

        if (!agent) {
            message = "Agent not found"
            return NextResponse.json({error: message}, {status: 404})
        }
        const databasesResponse = await handleDatabases(body, agent, lastContact)

        await db
            .update(drizzleDb.schemas.agent)
            .set(withUpdatedAt({
                version: body.version,
                lastContact: lastContact
            }))
            .where(eq(drizzleDb.schemas.agent.id, agentId));

        eventEmitter.emit('modification', {update: true});

        const response = {
            agent: {
                id: agentId,
                lastContact: lastContact
            },
            databases: databasesResponse
        }


        return Response.json(response)
    } catch (error) {
        console.error('Error in POST handler:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}

