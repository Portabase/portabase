import { z } from "zod";
import cron from "node-cron";

export const cronExpression = z
  .string()
  .trim()
  .refine((value) => cron.validate(value), {
    message: "Invalid cron expression",
  });

export const backupScheduleInput = z.union([z.literal(""), cronExpression]);
