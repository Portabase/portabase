import {NextResponse} from "next/server";
import {isUuidv4} from "@/utils/verify-uuid";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {and, eq} from "drizzle-orm";
import {sendNotificationsBackupRestore} from "@/features/notifications/helpers";
import {logger} from "@/lib/logger";
import {withUpdatedAt} from "@/db/utils";

const log = logger.child({module: "api/agent/restore"});

export type BodyResultRestore = {
    generatedId: string
    status: string
}
type RestorationStatus = 'waiting' | 'ongoing' | 'failed' | 'success';


export async function POST(
    request: Request,
    {params}: { params: Promise<{ agentId: string }> }
) {

    try {

        const agentId = (await params).agentId
        const body: BodyResultRestore = await request.json();


        if (!isUuidv4(body.generatedId)) {
            return NextResponse.json(
                {error: "generatedId is not a valid uuid"},
                {status: 500}
            );
        }

        const agent = await db.query.agent.findFirst({
            where: and(eq(drizzleDb.schemas.agent.id, agentId), eq(drizzleDb.schemas.agent.isArchived, false)),
        })
        if (!agent) {
            return NextResponse.json({error: "Agent not found"}, {status: 404})
        }

        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.agentDatabaseId, body.generatedId),
            with: {
                alertPolicies: true
            }
        })

        if (!database) {
            return NextResponse.json({error: "Database associated with generatedId provided not found"}, {status: 404})
        }

        const restoration = await db.query.restoration.findFirst({
            where: and(eq(drizzleDb.schemas.restoration.status, "ongoing"), eq(drizzleDb.schemas.restoration.databaseId, database.id),)
        })

        if (!restoration) {
            return NextResponse.json({error: "Unable to fin the corresponding restoration"}, {status: 404})
        }


        await db
            .update(drizzleDb.schemas.restoration)
            .set(withUpdatedAt({status: body.status as RestorationStatus}))
            .where(eq(drizzleDb.schemas.restoration.id, restoration.id));

        await sendNotificationsBackupRestore(database, body.status == "failed" ? "error_restore" : "success_restore");

        const response = {
            status: true,
            message: "Restoration successfully updated"
        }

        return Response.json(response, {status: 200})
    } catch (error) {
        log.error({error: error}, "Error in POST handler")
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}