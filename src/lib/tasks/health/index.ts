import {db} from "@/db";
import * as drizzleDb from "@/db";
import {isNotNull, sql} from "drizzle-orm";
import {sendHealthPingFailNotification} from "@/features/notifications/helpers";
import {DatabaseWith} from "@/db/schema/07_database";

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
            await sendHealthPingFailNotification(database as DatabaseWith);
        }
    } catch (e: any) {
        console.error("Health ping task failed:", e);
        throw e;
    }
};
