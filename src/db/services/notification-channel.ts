import {desc, eq} from "drizzle-orm";
import {db} from "@/db";
import {
    NotificationChannel,
    notificationChannel,
    organizationNotificationChannel
} from "@/db/schema/09_notification-channel";
import {storageChannel} from "@/db/schema/12_storage-channel";

export async function getOrganizationChannels(organizationId: string) {
    return await db
        .select({
            id: notificationChannel.id,
            name: notificationChannel.name,
            provider: notificationChannel.provider,
            config: notificationChannel.config,
            enabled: notificationChannel.enabled,
            updatedAt: notificationChannel.updatedAt,
            createdAt: notificationChannel.createdAt,
            deletedAt: notificationChannel.deletedAt,
            organizationId: notificationChannel.organizationId
        })
        .from(organizationNotificationChannel)
        .innerJoin(
            notificationChannel,
            eq(organizationNotificationChannel.notificationChannelId, notificationChannel.id)
        )
        .orderBy(desc(notificationChannel.createdAt))
        .where(eq(organizationNotificationChannel.organizationId, organizationId)) as unknown as NotificationChannel[];
}
