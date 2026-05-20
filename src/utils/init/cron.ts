import {cleaningHealthcheckLogsJob, cleaningJob, healthcheckAgentAndDatabaseJob, retentionJob} from "@/lib/tasks";
import {logger} from "@/lib/logger";

const log = logger.child({module: "init/cron"});


export async function setupCronJobs() {
    log.info("==== Setting up Cron Jobs ====");
    retentionJob.start();
    cleaningJob.start();
    cleaningHealthcheckLogsJob.start();
    healthcheckAgentAndDatabaseJob.start();
    log.info("==== Cron jobs started ====");
}