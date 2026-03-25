import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, gte, lt} from "drizzle-orm";

export async function getHealthLast12hLogs({id}: { id: string }) {
    const now = new Date()
    const since = new Date(now.getTime() - 12 * 60 * 60 * 1000)

    return db
        .select()
        .from(drizzleDb.schemas.healthcheckLog)
        .where(
            and(
                eq(drizzleDb.schemas.healthcheckLog.objectId, id),
                gte(drizzleDb.schemas.healthcheckLog.date, since)
            )
        )
}


export async function deleteHealthLogsOlderThan12h() {
    const now = new Date()
    const threshold = new Date(now.getTime() - 12 * 60 * 60 * 1000)

    const logsToDelete = await db
        .select()
        .from(drizzleDb.schemas.healthcheckLog)
        .where(
            lt(drizzleDb.schemas.healthcheckLog.date, threshold)
        )

    console.log(`Number of logs found to delete: ${logsToDelete.length}`)

    await db
        .delete(drizzleDb.schemas.healthcheckLog)
        .where(
            lt(drizzleDb.schemas.healthcheckLog.date, threshold)
        )

    return logsToDelete.length
}