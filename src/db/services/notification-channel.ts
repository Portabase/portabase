"use server";

import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  NotificationChannel,
  notificationChannel,
  organizationNotificationChannel,
} from "@/db/schema/09_notification-channel";

export async function getOrganizationChannels(
  organizationId: string,
): Promise<NotificationChannel[]> {
  const [orgChannels, systemChannels] = await Promise.all([
    db
      .select({
        id: notificationChannel.id,
        name: notificationChannel.name,
        provider: notificationChannel.provider,
        config: notificationChannel.config,
        enabled: notificationChannel.enabled,
        updatedAt: notificationChannel.updatedAt,
        createdAt: notificationChannel.createdAt,
        deletedAt: notificationChannel.deletedAt,
        organizationId: notificationChannel.organizationId,
      })
      .from(organizationNotificationChannel)
      .innerJoin(
        notificationChannel,
        eq(
          organizationNotificationChannel.notificationChannelId,
          notificationChannel.id,
        ),
      )
      .orderBy(desc(notificationChannel.createdAt))
      .where(
        eq(organizationNotificationChannel.organizationId, organizationId),
      ),
    db
      .select({
        id: notificationChannel.id,
        name: notificationChannel.name,
        provider: notificationChannel.provider,
        config: notificationChannel.config,
        enabled: notificationChannel.enabled,
        updatedAt: notificationChannel.updatedAt,
        createdAt: notificationChannel.createdAt,
        deletedAt: notificationChannel.deletedAt,
        organizationId: notificationChannel.organizationId,
      })
      .from(notificationChannel)
      .orderBy(desc(notificationChannel.createdAt))
      .where(isNull(notificationChannel.organizationId)),
  ]);

  const seen = new Set<string>();
  return [...orgChannels, ...systemChannels].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  }) as NotificationChannel[];
}
