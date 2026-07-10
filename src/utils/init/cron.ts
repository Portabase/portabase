import {cleaningHealthcheckLogsJob, cleaningJob, healthcheckAgentAndDatabaseJob, retentionJob} from "@/lib/tasks";
import {logger} from "@/lib/logger";
import { env } from "@/env.mjs";
import { startTelemetryCron } from "@/features/telemetry/cron";

const log = logger.child({module: "init/cron"});


export async function setupCronJobs() {
    log.info("==== Setting up Cron Jobs ====");
    retentionJob.start();
    cleaningJob.start();
    cleaningHealthcheckLogsJob.start();
    healthcheckAgentAndDatabaseJob.start();
    if (env.TELEMETRY) {
        await startTelemetryCron();
    }
    log.info("==== Cron jobs started ====");
}
