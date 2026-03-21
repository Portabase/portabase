import {db} from "@/db";
import * as drizzleDb from "@/db";
import {isNotNull} from "drizzle-orm";
import {sendHealthPingFailNotification} from "@/features/notifications/helpers";
import {DatabaseWith} from "@/db/schema/07_database";
import {notificationLog} from "@/db/schema/11_notification-log";

const HEALTH_THRESHOLD_SECONDS = 60;

export const healthPingTask = async () => {
    try {
        const databases = await db.query.database.findMany({
            where: isNotNull(drizzleDb.schemas.database.lastContact),
            with: {
                alertPolicies: {
                    with: {
                        notificationChannel: true,
                    },
                },
                agent: true,
                project: true,
            },
        });

        const now = Date.now();
        const unhealthyDatabases = databases.filter((database) => {
            if (!database.lastContact) return false;
            const secondsSinceContact = (now - database.lastContact.getTime()) / 1000;
            return secondsSinceContact > HEALTH_THRESHOLD_SECONDS;
        });

        console.log(`Health Ping: ${unhealthyDatabases.length} unhealthy database(s) detected out of ${databases.length} total`);

        for (const database of unhealthyDatabases) {
            // Always log the failure for chart data
            await db.insert(notificationLog).values({
                channelId: "00000000-0000-0000-0000-000000000000",
                provider: "system",
                providerName: "Health Ping Monitor",
                event: "health_ping_fail",
                title: "Health Ping Notification",
                message: `Health ping failed for database "${database.name}". No contact from agent.`,
                level: "critical",
                payload: {
                    host: database.name,
                    id: database.id,
                    agentDatabaseId: database.agentDatabaseId,
                    error: "Database unreachable - check agent connectivity",
                },
                success: true,
                error: null,
            });

            // Also dispatch to configured alert policies if any
            await sendHealthPingFailNotification(database as DatabaseWith);
        }
    } catch (e: any) {
        console.error("Health ping task failed:", e);
        throw e;
    }
};
