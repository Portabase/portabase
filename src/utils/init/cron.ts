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
    // node-cron auto-starts a task on cron.schedule(), so telemetryJob is armed
    // at module load. When opted out we must explicitly stop it (the in-callback
    // env.TELEMETRY guard is the second layer of the opt-out).
    if (env.TELEMETRY) {
        telemetryJob.start();
        log.info({ endpoint: getOtlpEndpoint() }, "Telemetry enabled");
    } else {
        telemetryJob.stop();
        log.info("Telemetry disabled (TELEMETRY=false)");
    }
    log.info("==== Cron jobs started ====");
}