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
//
//     const agents = await db.query.agent.findMany({
//         where: isNotNull(drizzleDb.schemas.agent.lastContact),
//     });
//
//     for (const agent of agents) {
//         const now = new Date()
//         if (agent.lastContact - now > 10min) {
//
//             if (agent.health_error_count < 4) {
//                 // peux pas depasser 3 count
//                 alors
//                 // update agent field health_error_count +1
//
//                 // send notifcations health_ping_fail
//
//
//                 const payload: EventPayload = {
//                     title: titleMap[event],
//                     message,
//                     level: level,
//                     event: event,
//                     data: {
//                         host: database.name,
//                         id: database.id,
//                         agentDatabaseId: database.agentDatabaseId,
//                         error,
//                     },
//                 };
//
//
//                 await dispatchNotification(payload, alertPolicy.id, undefined, undefined);
//             }else {
//                 pass
//             }
//         }
//
//
//         if (!db.retentionPolicy) continue;
//         await enforceRetention(db.id, db.retentionPolicy);
//     }
//
//
//
//     const now = new Date()
//     const threshold = new Date(now.getTime() - 12 * 60 * 60 * 1000)
//
//     const logsToDelete = await db
//         .select()
//         .from(drizzleDb.schemas.healthcheckLog)
//         .where(
//             lt(drizzleDb.schemas.healthcheckLog.date, threshold)
//         )
//
//     console.log(`Number of logs found to delete: ${logsToDelete.length}`)
//
//     await db
//         .delete(drizzleDb.schemas.healthcheckLog)
//         .where(
//             lt(drizzleDb.schemas.healthcheckLog.date, threshold)
//         )
//
//     return logsToDelete.length
// }