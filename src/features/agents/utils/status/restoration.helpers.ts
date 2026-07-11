import * as drizzleDb from "@/db";
import {db as dbClient} from "@/db";
import {eq} from "drizzle-orm";
import {logger} from "@/lib/logger";
import {sendNotificationsBackupRestore} from "@/features/notifications/utils/notifications.helpers";

const log = logger.child({module: "api/agent/status/restoration"});

export async function handleFailedRestoration(restorationId: string, databaseId: string, reason: string): Promise<void> {
    try {
        await dbClient
            .insert(drizzleDb.schemas.jobLog)
            .values({
                backupId: null,
                restorationId,
                loggedAt: new Date(),
                entryType: "log",
                level: "error",
                message: reason,
                command: null,
                output: null,
                exitCode: null,
                durationMs: null,
            });

        const databaseWithPolicies = await dbClient.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, databaseId),
            with: {alertPolicies: true},
        });

        if (databaseWithPolicies) {
            await sendNotificationsBackupRestore(databaseWithPolicies, "error_restore");
        }
    } catch (err) {
        log.error({error: err, name: "handleFailedRestoration"}, "Failed to record restoration failure job log / notification");
    }
}
