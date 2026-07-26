import { z } from "zod";
import cron from "node-cron";

/**
 * A validated cron expression, checked with node-cron — the same engine that
 * runs the backup scheduler, so anything accepted here is schedulable.
 */
export const cronExpression = z
  .string()
  .trim()
  .refine((value) => cron.validate(value), {
    message: "Invalid cron expression",
  });

/**
 * A backup-schedule input: a valid cron expression, or an empty string to
 * clear the schedule.
 */
export const backupScheduleInput = z.union([z.literal(""), cronExpression]);
