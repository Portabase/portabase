import { z } from "zod";

export const RetentionSchema = z.object({
  type: z.enum(["count", "days", "gfs"]).optional(),
  count: z.number().min(1).max(100),
  days: z.number().min(1).max(3650),
  gfs: z.object({
    daily: z.number().min(1).max(31),
    weekly: z.number().min(0).max(52),
    monthly: z.number().min(0).max(120),
    yearly: z.number().min(0).max(50),
  }),
});

export const EventKindSchema = z.enum([
  "error_backup",
  "error_restore",
  "success_restore",
  "success_backup",
  "weekly_report",
  "error_health_agent",
  "error_health_database",
] as const);

export const NotifPolicySchema = z.object({
  channelId: z.string().min(1),
  eventKinds: z.array(EventKindSchema),
  enabled: z.boolean(),
});

export const StoragePolicyInputSchema = z.object({
  channelId: z.string().min(1),
  enabled: z.boolean(),
});

export const ApplyDbSettingsSchema = z.object({
  databaseId: z.string().min(1),
  section: z.enum(["retention", "scheduling", "notifications", "storage", "all"]),
  retention: RetentionSchema.optional(),
  backupMethod: z.enum(["manual", "automatic"]).optional(),
  backupCron: z.string().optional(),
  notificationPolicies: z.array(NotifPolicySchema).optional(),
  storagePolicies: z.array(StoragePolicyInputSchema).optional(),
});
