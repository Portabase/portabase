import cron from "node-cron";
import {retentionCleanTask} from "@/lib/tasks/database";
import {env} from "@/env.mjs";
import {backupCleanTask} from "@/lib/tasks/cleaning";
import {healthPingTask} from "@/lib/tasks/health";


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

export const healthPingJob = cron.schedule(env.HEALTH_PING_CRON, async () => {
    try {
        console.log("Health Ping Job : Starting task");
        await healthPingTask();
    } catch (err) {
        console.error(`[CRON] Error:`, err);
    }
});