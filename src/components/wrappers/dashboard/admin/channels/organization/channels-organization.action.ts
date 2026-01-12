"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import {and, eq, inArray} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";


export const updateNotificationChannelsOrganizationAction = userAction
    .schema(
        z.object({
            data: z.array(z.string()),
            id: z.string(),
        })
    )
    .action(async ({parsedInput , ctx}): Promise<ServerActionResult<null>> => {
        try {
            const organizationsIds = parsedInput.data;
            const notificationChannelId = parsedInput.id;

            const notificationChannel = await db.query.notificationChannel.findFirst({
                where: eq(drizzleDb.schemas.notificationChannel.id, notificationChannelId),
                with: {
                    organizations: true,
                }
            }) as NotificationChannelWith;


            if (!notificationChannel) {
                return {
                    success: false,
                    actionError: {
                        message: "Notification channel not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            const existingItemIds = notificationChannel.organizations.map((organization) => organization.organizationId);

            const organizationsToAdd = organizationsIds.filter((id) => !existingItemIds.includes(id));
            const organizationsToRemove = existingItemIds.filter((id) => !organizationsIds.includes(id));

            if (organizationsToAdd.length > 0) {
                for (const organizationToAdd of organizationsToAdd) {
                    await db.insert(drizzleDb.schemas.organizationNotificationChannel).values({
                        organizationId: organizationToAdd,
                        notificationChannelId: notificationChannelId
                    });
                }
            }
            if (organizationsToRemove.length > 0) {
                await db.delete(drizzleDb.schemas.organizationNotificationChannel).where(and(inArray(drizzleDb.schemas.organizationNotificationChannel.organizationId, organizationsToRemove), eq(drizzleDb.schemas.organizationNotificationChannel.notificationChannelId,notificationChannelId))).execute();

            }

            return {
                success: true,
                value: null,
                actionSuccess: {
                    message: "Notification channel organizations has been successfully updated.",
                    messageParams: {notificationChannelId: notificationChannelId},
                },
            };
        } catch (error) {
            console.error("Error updating notification channel:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update notification channel.",
                    status: 500,
                    cause: "server_error",
                    messageParams: {message: "Error updating the notification channel"},
                },
            };
        }
    });


export const updateStorageChannelsOrganizationAction = userAction
    .schema(
        z.object({
            data: z.array(z.string()),
            id: z.string(),
        })
    )
    .action(async ({parsedInput, ctx}): Promise<ServerActionResult<null>> => {
        try {
            const organizationsIds = parsedInput.data;
            const storageChannelId = parsedInput.id;

            const storageChannel = await db.query.storageChannel.findFirst({
                where: eq(drizzleDb.schemas.storageChannel.id, storageChannelId),
                with: {
                    organizations: true,
                }
            }) as StorageChannelWith;


            if (!storageChannel) {
                return {
                    success: false,
                    actionError: {
                        message: "Storage channel not found.",
                        status: 404,
                        cause: "not_found",
                    },
                };
            }

            const existingItemIds = storageChannel.organizations.map((organization) => organization.organizationId);

            const organizationsToAdd = organizationsIds.filter((id) => !existingItemIds.includes(id));
            const organizationsToRemove = existingItemIds.filter((id) => !organizationsIds.includes(id));

            if (organizationsToAdd.length > 0) {
                for (const organizationToAdd of organizationsToAdd) {
                    await db.insert(drizzleDb.schemas.organizationStorageChannel).values({
                        organizationId: organizationToAdd,
                        storageChannelId: storageChannelId
                    });
                }
            }

            if (organizationsToRemove.length > 0) {
                await db.delete(drizzleDb.schemas.organizationStorageChannel).where(and(inArray(drizzleDb.schemas.organizationStorageChannel.organizationId, organizationsToRemove), eq(drizzleDb.schemas.organizationStorageChannel.storageChannelId, storageChannelId))).execute();

            }

            return {
                success: true,
                value: null,
                actionSuccess: {
                    message: "Storage channel organizations has been successfully updated.",
                    messageParams: {storageChannelId: storageChannelId},
                },
            };
        } catch (error) {
            console.error("Error updating storage channel:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update storage channel.",
                    status: 500,
                    cause: "server_error",
                    messageParams: {message: "Error updating the storage channel"},
                },
            };
        }
    });
