import {cleaningHealthcheckLogsJob, cleaningJob, healthcheckAgentAndDatabaseJob, retentionJob, telemetryJob} from "@/lib/tasks";
import {logger} from "@/lib/logger";
import { env } from "@/env.mjs";
import { getOtlpEndpoint } from "@/features/telemetry/constants";

const log = logger.child({module: "init/cron"});


export async function setupCronJobs() {
    log.info("==== Setting up Cron Jobs ====");
    retentionJob.start();
    cleaningJob.start();
    cleaningHealthcheckLogsJob.start();
    healthcheckAgentAndDatabaseJob.start();
    if (env.TELEMETRY) {
        telemetryJob.start();
        log.info({ endpoint: getOtlpEndpoint() }, "Telemetry enabled");
    }
    log.info("==== Cron jobs started ====");
}