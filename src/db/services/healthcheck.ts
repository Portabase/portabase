import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, gte, isNotNull, lt} from "drizzle-orm";
import {enforceRetention} from "@/lib/tasks/database";
import {dispatchNotification} from "@/features/notifications/dispatch";
import {EventKind, EventPayload} from "@/features/notifications/types";
import {DatabaseWith} from "@/db/schema/07_database";

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



//
// export async function sendNotificationsHealthCheck(event: EventKind) {
//
//
//
//     const date = new Date();
//     let level: "info" | "critical" = "info";
//     let message = "";
//     let error: string | null = null;
//
//     switch (event) {
//         case "error_backup":
//         case "error_restore":
//             level = "critical";
//             message = `An error occurred during ${event.includes("backup") ? "backup" : "restore"} on ${date.toISOString()}.`;
//             error = "Check database connection or agent";
//             break;
//         case "success_backup":
//         case "success_restore":
//             level = "info";
//             message = `${event.includes("backup") ? "Backup" : "Restore"} completed successfully at ${date.toISOString()}.`;
//             break;
//         case "weekly_report":
//             level = "info";
//             message = `Weekly report generated at ${date.toISOString()}.`;
//             break;
//     }
//
//
//
//
//
//
//
//
//
//
//     const activePolicies = database.alertPolicies.filter(policy =>
//         policy.enabled && policy.eventKinds.includes(event)
//     );
//
//     const promises = activePolicies.map(alertPolicy => {
//         const date = new Date();
//         let level: "info" | "critical" = "info";
//         let message = "";
//         let error: string | null = null;
//
//         switch (event) {
//             case "error_backup":
//             case "error_restore":
//                 level = "critical";
//                 message = `An error occurred during ${event.includes("backup") ? "backup" : "restore"} on ${date.toISOString()}.`;
//                 error = "Check database connection or agent";
//                 break;
//             case "success_backup":
//             case "success_restore":
//                 level = "info";
//                 message = `${event.includes("backup") ? "Backup" : "Restore"} completed successfully at ${date.toISOString()}.`;
//                 break;
//             case "weekly_report":
//                 level = "info";
//                 message = `Weekly report generated at ${date.toISOString()}.`;
//                 break;
//         }
//
//         const titleMap: Record<EventKind, string> = {
//             error_backup: `Backup Notification`,
//             error_restore: `Restore Notification`,
//             success_backup: `Backup Notification`,
//             success_restore: `Restore Notification`,
//             weekly_report: `Weekly Report Notification`,
//         };
//
//         const payload: EventPayload = {
//             title: titleMap[event],
//             message,
//             level: level,
//             event: event,
//             data: {
//                 host: database.name,
//                 id: database.id,
//                 agentDatabaseId: database.agentDatabaseId,
//                 error,
//             },
//         };
//
//         return dispatchNotification(payload, alertPolicy.id, undefined, undefined);
//     });
//
//
//     return Promise.all(promises);
// }
//
//
//
// export async function checkAgentsHealthError() {
//     const agents = await db.query.agent.findMany({
//         where: isNotNull(drizzleDb.schemas.agent.lastContact),
//     });
//
//     const settings = await db.query.setting.findFirst({
//         where: (fields, { eq }) => eq(fields.name, "system"),
//     });
//
//     if (!settings) {
//         throw new Error("System settings not found");
//     }
//
//     const now = new Date();
//
//     for (const agent of agents) {
//         if (!agent.lastContact) continue;
//
//         const lastContactDate = new Date(agent.lastContact);
//         const diffMinutes = (now.getTime() - lastContactDate.getTime()) / 1000 / 60;
//
//         if (diffMinutes > 10) {
//             if ((agent.health_error_count ?? 0) < 3) {
//                 await db.update(drizzleDb.schemas.agent)
//                     .set({
//                         health_error_count: (agent.health_error_count ?? 0) + 1,
//                     })
//                     .where(drizzleDb.schemas.agent.id.eq(agent.id));
//
//                 const payload: EventPayload = {
//                     title: "Agent down",
//                     message: `Agent ${agent.name} is down`,
//                     level: "critical",
//                     event: "error_health_agent",
//                     data: {
//                         agent: agent.name,
//                         id: agent.id,
//                         error: "Agent is down",
//                     },
//                 };
//
//                 await dispatchNotification(
//                     payload,
//                     undefined,
//                     settings.defaultNotificationChannelId,
//                     undefined
//                 );
//             }
//
//         }
//     }
// }