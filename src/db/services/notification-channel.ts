import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  NotificationChannel,
  notificationChannel,
  organizationNotificationChannel,
} from "@/db/schema/09_notification-channel";

export async function getOrganizationChannels(
  organizationId: string,
): Promise<NotificationChannel[]> {
  const channels = await db
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
    .where(eq(organizationNotificationChannel.organizationId, organizationId));

  return channels.map((c) =>
    c.organizationId === organizationId ? c : { ...c, config: null },
  ) as NotificationChannel[];
}
