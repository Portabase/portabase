import { DatabaseWith } from "@/db/schema/07_database";
import { EventKind, EventPayload } from "@/features/notifications/types";
import { dispatchNotification } from "@/features/notifications/dispatch";

export async function sendNotificationsBackupRestore(database: DatabaseWith, event: EventKind) {
    if (!database.alertPolicies || database.alertPolicies.length === 0) {
        return [];
    }

    const activePolicies = database.alertPolicies.filter(policy => 
        policy.enabled && policy.eventKinds.includes(event)
    );

    const promises = activePolicies.map(alertPolicy => {
        const date = new Date();
        let level: "info" | "critical" = "info";
        let message = "";
        let error: string | null = null;

        switch (event) {
            case "error_backup":
            case "error_restore":
                level = "critical";
                message = `An error occurred during ${event.includes("backup") ? "backup" : "restore"} on ${date.toISOString()}.`;
                error = "Check database connection or agent";
                break;
            case "success_backup":
            case "success_restore":
                level = "info";
                message = `${event.includes("backup") ? "Backup" : "Restore"} completed successfully at ${date.toISOString()}.`;
                break;
            case "weekly_report":
                level = "info";
                message = `Weekly report generated at ${date.toISOString()}.`;
                break;
        }

        const titleMap: Record<EventKind, string> = {
            error_backup: `Backup Notification`,
            error_restore: `Restore Notification`,
            success_backup: `Backup Notification`,
            success_restore: `Restore Notification`,
            weekly_report: `Weekly Report Notification`,
        };

        const payload: EventPayload = {
            title: titleMap[event],
            message,
            level: level,
            event: event,
            data: {
                host: database.name,
                id: database.id,
                agentDatabaseId: database.agentDatabaseId,
                error,
            },
        };

        return dispatchNotification(payload, alertPolicy.id, undefined, undefined);
    });


    return Promise.all(promises);
}