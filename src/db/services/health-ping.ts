import {and, desc, eq, gte, inArray, sql} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {notificationLog} from "@/db/schema/11_notification-log";

export type HealthPingFailure = {
    databaseId: string;
    databaseName: string;
    timestamp: Date;
};

export async function getHealthPingFailures(
    databaseIds: string[],
    days: number = 90
): Promise<HealthPingFailure[]> {
    if (databaseIds.length === 0) return [];

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
        .select({
            payload: notificationLog.payload,
            sentAt: notificationLog.sentAt,
            title: notificationLog.title,
        })
        .from(notificationLog)
        .where(
            and(
                eq(notificationLog.event, "health_ping_fail"),
                gte(notificationLog.sentAt, since)
            )
        )
        .orderBy(desc(notificationLog.sentAt));

    return rows
        .filter((row) => {
            const payload = row.payload as Record<string, any> | null;
            return payload?.id && databaseIds.includes(payload.id);
        })
        .map((row) => {
            const payload = row.payload as Record<string, any>;
            return {
                databaseId: payload.id as string,
                databaseName: (payload.host as string) || "",
                timestamp: row.sentAt,
            };
        });
}

export async function getDatabasesWithHealth(organizationIds: string[]) {
    if (organizationIds.length === 0) return [];

    const projects = await db.query.project.findMany({
        where: inArray(drizzleDb.schemas.project.organizationId, organizationIds),
    });

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return [];

    const databases = await db.query.database.findMany({
        where: inArray(drizzleDb.schemas.database.projectId, projectIds),
        with: {
            agent: true,
            project: true,
        },
    });

    return databases;
}
