import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  NotificationLevel,
  notificationLog,
} from "@/db/schema/11_notification-log";
import { notificationChannel } from "@/db/schema/09_notification-channel";
import { db } from "@/db";
import { Json } from "drizzle-zod";

export type NotificationLogWithRelations = {
  id: string;
  title: string;
  level: NotificationLevel;
  success: boolean;
  error: string | null;
  sentAt: Date;
  payload: Json | null;
  content: {
    title: string;
    message: string;
  };
  channel: {
    name: string;
    provider: string;
  } | null;
  policy: {
    event: string | null;
  } | null;
};

export async function getNotificationHistory(filters?: {
  channelId?: string;
  policyId?: string;
  organizationId?: string;
  level?: NotificationLevel;
  success?: boolean;
  from?: Date;
  to?: Date;
  limit?: number;
}): Promise<NotificationLogWithRelations[]> {
  const where = [];
  if (filters?.channelId)
    where.push(eq(notificationLog.channelId, filters.channelId));
  if (filters?.policyId)
    where.push(eq(notificationLog.policyId, filters.policyId));
  if (filters?.organizationId)
    where.push(eq(notificationLog.organizationId, filters.organizationId));
  if (filters?.level) where.push(eq(notificationLog.level, filters.level));
  if (typeof filters?.success === "boolean")
    where.push(eq(notificationLog.success, filters.success));
  if (filters?.from) where.push(gte(notificationLog.sentAt, filters.from));
  if (filters?.to) where.push(lte(notificationLog.sentAt, filters.to));

  const rows = await db
    .select({
      id: notificationLog.id,
      title: notificationLog.title,
      level: notificationLog.level,
      success: notificationLog.success,
      error: notificationLog.error,
      sentAt: notificationLog.sentAt,
      payload: notificationLog.payload,
      content: {
        title: notificationLog.title,
        message: notificationLog.message,
      },
      channel: {
        name: notificationLog.providerName,
        provider: notificationLog.provider,
      },
      policy: {
        event: notificationLog.event,
      },
    })
    .from(notificationLog)
    .leftJoin(
      notificationChannel,
      eq(notificationLog.channelId, notificationChannel.id),
    )
    // .leftJoin(alertPolicy, eq(notificationLog.policyId, alertPolicy.id))
    .where(and(...where))
    .orderBy(desc(notificationLog.sentAt))
    .limit(filters?.limit || 100);

  return rows.map((row) => ({
    ...row,
    payload: row.payload as Json,
  }));
}
