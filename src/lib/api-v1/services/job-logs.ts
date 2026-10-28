import {and, asc, eq, isNull} from "drizzle-orm";
import {NextResponse} from "next/server";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {isUuid} from "@/lib/api-v1/validation/uuid";

export async function jobLogsResponse(kind: "backup" | "restoration", databaseId: string, jobId: string | undefined) {
    const {backup, restoration, jobLog} = drizzleDb.schemas;
    const job = isUuid(jobId)
        ? kind === "backup"
            ? await db.query.backup.findFirst({
                where: and(eq(backup.id, jobId), eq(backup.databaseId, databaseId), isNull(backup.deletedAt)),
                columns: {id: true},
            })
            : await db.query.restoration.findFirst({
                where: and(eq(restoration.id, jobId), eq(restoration.databaseId, databaseId), isNull(restoration.deletedAt)),
                columns: {id: true},
            })
        : undefined;

    if (!job) {
        return NextResponse.json(
            {error: kind === "backup" ? "Backup not found" : "Restoration not found"},
            {status: 404}
        );
    }

    const logs = await db.query.jobLog.findMany({
        where: kind === "backup" ? eq(jobLog.backupId, job.id) : eq(jobLog.restorationId, job.id),
        orderBy: [asc(jobLog.loggedAt)],
    });
    return NextResponse.json({data: logs});
}
