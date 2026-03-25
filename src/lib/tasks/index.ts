import cron from "node-cron";
import {retentionCleanTask} from "@/lib/tasks/database";
import {env} from "@/env.mjs";
import {backupCleanTask} from "@/lib/tasks/cleaning";
import {deleteHealthLogsOlderThan12h} from "@/db/services/healthcheck";

export const retentionJob = cron.schedule(env.RETENTION_CRON, async () => {
    try {
        console.log("Retention Job : Starting task");
        await retentionCleanTask();
    } catch (err) {
        console.error(`[CRON] Error:`, err);
    }
});

export const cleaningJob = cron.schedule("* * * * *", async () => {
    try {
        console.log("Cleaning Job : Starting task");
        await backupCleanTask();
    } catch (err) {
        console.error(`[CRON] Error:`, err);
    }
});

export const cleaningHealthcheckLogsJob = cron.schedule(env.CLEANING_HEALTHCHECK_LOGS_CRON, async () => {
    try {
        console.log("Cleaning Healthcheck Logs Job : Starting task");
        await deleteHealthLogsOlderThan12h();
    } catch (err) {
        console.error(`[CRON] Error:`, err);
    }
});