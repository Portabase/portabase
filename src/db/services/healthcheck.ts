import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, gte, isNotNull, lt} from "drizzle-orm";
import {dispatchNotification} from "@/features/notifications/dispatch";
import {EventPayload} from "@/features/notifications/types";

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

export async function checkAgentsHealthError() {
    const agents = await db.query.agent.findMany({
        where: isNotNull(drizzleDb.schemas.agent.lastContact),
    });

    const settings = await db.query.setting.findFirst({
        where: (fields, {eq}) => eq(fields.name, "system"),
    });

    if (!settings) {
        throw new Error("System settings not found");
    }

    if (!settings.defaultNotificationChannelId) {
        console.error("No default notification channel id found.");
        return
    }

    const now = new Date();

    for (const agent of agents) {
        if (!agent.lastContact) continue;

        const lastContactDate = new Date(agent.lastContact);
        const diffMinutes = (now.getTime() - lastContactDate.getTime()) / 1000 / 60;

        if (diffMinutes > 10) {
            if ((agent.healthErrorCount ?? 0) < 3) {

                const newHealthErrorCount = (agent.healthErrorCount ?? 0) + 1
                await db.update(drizzleDb.schemas.agent)
                    .set({
                        healthErrorCount: newHealthErrorCount,
                    })
                    .where(eq(drizzleDb.schemas.agent.id, agent.id));

                const payload: EventPayload = {
                    title: "Agent down",
                    message: `Agent ${agent.name} is down, (notification number: ${newHealthErrorCount}/3)`,
                    level: "critical",
                    event: "error_health_agent",
                    data: {
                        agent: agent.name,
                        id: agent.id,
                        error: "Agent is down",
                    },
                };

                console.log("[Agent Healthcheck] :", payload);

                await dispatchNotification(
                    payload,
                    undefined,
                    settings.defaultNotificationChannelId,
                    undefined
                );
            }

        }
    }
}



export async function checkDatabasesHealthError() {

    const databases = await db.query.database.findMany({
        where: isNotNull(drizzleDb.schemas.database.lastContact),
        with: {
            agent: true,
            alertPolicies: true
        }
    })

    const now = new Date();

    for (const database of databases) {
        if (!database.lastContact) continue;

        const lastContactDate = new Date(database.lastContact);
        const diffMinutes = (now.getTime() - lastContactDate.getTime()) / 1000 / 60;

        if (diffMinutes > 10) {
            if ((database.healthErrorCount ?? 0) < 3) {

                const newHealthErrorCount = (database.healthErrorCount ?? 0) + 1
                await db.update(drizzleDb.schemas.database)
                    .set({
                        healthErrorCount: newHealthErrorCount,
                    })
                    .where(eq(drizzleDb.schemas.database.id, database.id));

                const settings = await db.query.setting.findFirst({
                    where: eq(drizzleDb.schemas.setting.name, "system"),
                    with: { notificationChannel: true },
                });

                const defaultPolicy = settings?.notificationChannel
                    ? [{
                        id: null,
                        notificationChannelId: settings.notificationChannel.id,
                        enabled: settings.notificationChannel.enabled,
                        eventKinds: ["error_health_database"]
                    }]
                    : [];

                const policiesToUse = (database.alertPolicies && database.alertPolicies.length > 0)
                    ? database.alertPolicies.filter(policy => policy.enabled && policy.eventKinds.includes("error_health_database"))
                    : defaultPolicy;

                if (!policiesToUse || policiesToUse.length === 0) {
                    continue
                }


                const promises = policiesToUse.map(alertPolicy => {

                    const payload: EventPayload = {
                        title: "Database down",
                        message: `Database ${database.name} is down, (notification number: ${newHealthErrorCount}/3)`,
                        level: "critical",
                        event: "error_health_database",
                        data: {
                            agent: database.name,
                            id: database.id,
                            error: "Database is down",
                        },
                    };

                    console.log("[Database Healthcheck] :", payload);

                    return dispatchNotification(payload, alertPolicy.id == null ? undefined : alertPolicy.id, alertPolicy.id ? undefined : alertPolicy.notificationChannelId, undefined);
                });

                await Promise.all(promises);

            }

        }
    }
}


