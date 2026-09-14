import {
    checkBackupPresenceJob,
    cleaningHealthcheckLogsJob,
    cleaningJob,
    healthcheckAgentAndDatabaseJob,
    retentionJob,
    startCleaningJobLogsCron,
    startCleaningBackupsCron
} from "@/lib/tasks";
import {logger} from "@/lib/logger";
import {env} from "@/env.mjs";
import {startTelemetryCron} from "@/features/telemetry/cron";

const log = logger.child({module: "init/cron"});

export async function setupCronJobs() {
    log.info("==== Setting up Cron Jobs ====");
    retentionJob.start();
    cleaningJob.start();
    cleaningHealthcheckLogsJob.start();
    healthcheckAgentAndDatabaseJob.start();
    checkBackupPresenceJob.start();

    if (env.CLEANING_JOB_LOGS_ENABLED) {
        if (!env.CLEANING_JOB_LOGS_RETENTION_DAYS) {
            log.error("CLEANING_JOB_LOGS_ENABLED=true but CLEANING_JOB_LOGS_RETENTION_DAYS is missing/invalid; job_logs cleanup NOT started");
        } else {
            startCleaningJobLogsCron();
            log.info("Job logs cleanup cron started");
        }
    }

    if (env.CLEANING_BACKUPS_ENABLED) {
        if (!env.CLEANING_BACKUPS_RETENTION_DAYS) {
            log.error("CLEANING_BACKUPS_ENABLED=true but CLEANING_BACKUPS_RETENTION_DAYS is missing/invalid; backups cleanup NOT started");
        } else {
            startCleaningBackupsCron();
            log.info("Deleted backups cleanup cron started");
        }
    }

    if (env.TELEMETRY) {
        await startTelemetryCron();
    }
    log.info("==== Cron jobs started ====");
}
