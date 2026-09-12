import {db, schemas} from "@/db";
import {and, count, inArray, isNotNull, lt} from "drizzle-orm";
import {env} from "@/env.mjs";
import {logger} from "@/lib/logger";
import {cutoffFrom} from "./cleanup-helpers";

const log = logger.child({module: "tasks/cleaning/job-logs"});

const MAX_BATCHES_PER_RUN = 1000;

export async function cleanJobLogsTask(): Promise<void> {
    const retentionDays = env.CLEANING_JOB_LOGS_RETENTION_DAYS;
    if (!retentionDays) {
        log.error("job_logs cleanup aborted: retention days missing/invalid");
        return;
    }

    const cutoff = cutoffFrom(new Date(), retentionDays);
    const batchSize = env.CLEANING_JOB_LOGS_BATCH_SIZE;

    log.info("Starting job logs cleanup");

    const eligibleBackupIds = db
        .select({id: schemas.backup.id})
        .from(schemas.backup)
        .where(
            and(
                isNotNull(schemas.backup.deletedAt),
                lt(schemas.backup.deletedAt, cutoff),
            ),
        );

    const eligibleWhere = and(
        lt(schemas.jobLog.loggedAt, cutoff),
        inArray(schemas.jobLog.backupId, eligibleBackupIds),
    );

    const [{value: found}] = await db
        .select({value: count()})
        .from(schemas.jobLog)
        .where(eligibleWhere);

    log.info(`Found ${found} eligible job logs`);

    let totalDeleted = 0;
    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
        const ids = await db
            .select({id: schemas.jobLog.id})
            .from(schemas.jobLog)
            .where(eligibleWhere)
            .limit(batchSize);

        if (ids.length === 0) break;

        await db.delete(schemas.jobLog).where(
            inArray(
                schemas.jobLog.id,
                ids.map((r) => r.id),
            ),
        );

        totalDeleted += ids.length;
        log.info(`Deleted ${ids.length} job logs`);

        if (ids.length < batchSize) break;
    }

    log.info(`Job logs cleanup completed: ${totalDeleted} entries deleted`);
}
