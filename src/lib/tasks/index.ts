import cron from "node-cron";
import {retentionCleanTask} from "@/lib/tasks/database";
import {env} from "@/env.mjs";
import {backupCleanTask} from "@/lib/tasks/cleaning";
import {
    checkAgentsHealthError,
    checkDatabasesHealthError,
    deleteHealthLogsOlderThan12h
} from "@/db/services/healthcheck";
import {logger} from "@/lib/logger";

const log = logger.child({module: "tasks"});

export const retentionJob = cron.schedule(env.RETENTION_CRON, async () => {
    try {
        log.info({ job: "cron", action: "start", name: "retentionJob" }, "Retention Job started");
        await retentionCleanTask();
    } catch (err) {
        log.error({ job: "cron", name: "retentionJob", error: err }, "Retention Job Error");
    }
});

export const cleaningJob = cron.schedule("* * * * *", async () => {
    try {
        log.info({ job: "cron", action: "start", name: "cleaningJob" }, "Cleaning Job started");
        await backupCleanTask();
    } catch (err) {
        log.error({ job: "cron", name: "cleaningJob", error: err }, "Cleaning Job Error");
    }
});

export const cleaningHealthcheckLogsJob = cron.schedule(env.CLEANING_HEALTHCHECK_LOGS_CRON, async () => {
    try {
        log.info({ job: "cron", action: "start", name: "cleaningHealthcheckLogsJob" }, "Cleaning Health Logs Job started");
        await deleteHealthLogsOlderThan12h();
    } catch (err) {
        log.error({ job: "cron", name: "cleaningHealthcheckLogsJob", error: err }, "Cleaning Health Logs Job Error");
    }
});


export const healthcheckAgentAndDatabaseJob = cron.schedule(env.HEALTHCHECK_CRON, async () => {
    try {
        log.info({ job: "cron", action: "start", name: "healthcheckAgentAndDatabaseJob" }, "Healthcheck Jobs started");
        await checkAgentsHealthError();
        await checkDatabasesHealthError()
    } catch (err) {
        log.error({ job: "cron", name: "healthcheckAgentAndDatabaseJob", error: err }, "Healthcheck Jobs Error");
    }
});