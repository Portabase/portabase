"use server";
import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { JobLog } from "@/db/schema/17_job-log";

export const fetchJobLogsAction = userAction
    .schema(
        z.object({
            backupId: z.string().optional(),
            restorationId: z.string().optional(),
        }),
    )
    .action(async ({ parsedInput }): Promise<JobLog[]> => {
        const { backupId, restorationId } = parsedInput;

        if (backupId) {
            return (await db.query.jobLog.findMany({
                where: eq(drizzleDb.schemas.jobLog.backupId, backupId),
                orderBy: (l, { asc }) => [asc(l.loggedAt)],
            })) as JobLog[];
        }
        if (restorationId) {
            return (await db.query.jobLog.findMany({
                where: eq(drizzleDb.schemas.jobLog.restorationId, restorationId),
                orderBy: (l, { asc }) => [asc(l.loggedAt)],
            })) as JobLog[];
        }
        return [];
    });
