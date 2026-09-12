import {db, schemas} from "@/db";
import {and, count, inArray, isNotNull, lt} from "drizzle-orm";
import {env} from "@/env.mjs";
import {logger} from "@/lib/logger";
import {cutoffFrom} from "./cleanup-helpers";

const log = logger.child({module: "tasks/cleaning/backups"});

const MAX_BATCHES_PER_RUN = 1000;

export async function cleanDeletedBackupsTask(): Promise<void> {
    const retentionDays = env.CLEANING_BACKUPS_RETENTION_DAYS;
    if (!retentionDays) {
        log.error("backups cleanup aborted: retention days missing/invalid");
        return;
    }

    const cutoff = cutoffFrom(new Date(), retentionDays);
    const batchSize = env.CLEANING_BACKUPS_BATCH_SIZE;

    log.info("Starting deleted backups cleanup");

    const eligibleWhere = and(
        isNotNull(schemas.backup.deletedAt),
        lt(schemas.backup.deletedAt, cutoff),
    );

    const [{value: found}] = await db
        .select({value: count()})
        .from(schemas.backup)
        .where(eligibleWhere);

    log.info(`Found ${found} eligible backups`);

    let totalDeleted = 0;
    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
        const ids = await db
            .select({id: schemas.backup.id})
            .from(schemas.backup)
            .where(eligibleWhere)
            .limit(batchSize);

        if (ids.length === 0) break;

        await db.delete(schemas.backup).where(
            inArray(
                schemas.backup.id,
                ids.map((r) => r.id),
            ),
        );

        totalDeleted += ids.length;
        log.info(`Deleted ${ids.length} expired backups`);

        if (ids.length < batchSize) break;
    }

    log.info(`Deleted backups cleanup completed: ${totalDeleted} backups deleted`);
}
