"use server";

import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {db} from "@/db";
import {and, eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {
    NotificationChannelFormSchema
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/channel-form.schema";


export const addNotificationChannelAction = userAction.schema(
    z.object({
        organizationId: z.string().optional(),
        data: NotificationChannelFormSchema
    })
).action(async ({parsedInput}): Promise<ServerActionResult<NotificationChannel>> => {
    const {organizationId, data} = parsedInput;
    try {
        const [channel] = await db
            .insert(drizzleDb.schemas.notificationChannel)
            .values({
                provider: data.provider,
                name: data.name,
                config: data.config,
                enabled: data.enabled ?? true,
            })
            .returning();

        if (organizationId) {
            await db.insert(drizzleDb.schemas.organizationNotificationChannel).values({
                organizationId,
                notificationChannelId: channel.id,
            });
        }

        return {
            success: true,
            value: {
                ...channel,
                config: channel.config as JSON
            },
            actionSuccess: {
                message: "Notification channel has been successfully created.",
                messageParams: {notificationChannelId: channel.id},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to create notification channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {notificationChannelId: ""},
            },
        };
    }
});

export const removeNotificationChannelAction = userAction.schema(
    z.object({
        organizationId: z.string().optional(),
        notificationChannelId: z.string(),
    })
).action(async ({parsedInput}): Promise<ServerActionResult<NotificationChannel>> => {
    const {organizationId, notificationChannelId} = parsedInput;

    try {
        if (organizationId) {
            await db
                .delete(drizzleDb.schemas.organizationNotificationChannel)
                .where(
                    and(
                        eq(drizzleDb.schemas.organizationNotificationChannel.organizationId, organizationId),
                        eq(drizzleDb.schemas.organizationNotificationChannel.notificationChannelId, notificationChannelId)
                    )
                );
        }

        const [deletedChannel] = await db
            .delete(drizzleDb.schemas.notificationChannel)
            .where(eq(drizzleDb.schemas.notificationChannel.id, notificationChannelId))
            .returning();

        if (!deletedChannel) {
            return {
                success: false,
                actionError: {
                    message: "Notification channel not found.",
                    status: 404,
                    messageParams: {notificationChannelId: notificationChannelId},
                },
            };
        }

        return {
            success: true,
            value: {
                ...deletedChannel,
                config: deletedChannel.config as JSON
            },
            actionSuccess: {
                message: "Notification channel has been successfully removed.",
                messageParams: {notificationChannelId: notificationChannelId},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to remove notification channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {notificationChannelId: notificationChannelId},
            },
        };
    }
});


export const updateNotificationChannelAction = userAction.schema(
    z.object({
        id: z.string(),
        data: NotificationChannelFormSchema
    })
).action(async ({parsedInput}): Promise<ServerActionResult<NotificationChannel>> => {
    const {id, data} = parsedInput;

    try {
        const [channel] = await db
            .update(drizzleDb.schemas.notificationChannel)
            .set(withUpdatedAt({
                provider: data.provider,
                name: data.name,
                config: data.config,
                enabled: data.enabled ?? true,
            }))
            .where(eq(drizzleDb.schemas.notificationChannel.id, id))
            .returning();

        return {
            success: true,
            value: {
                ...channel,
                config: channel.config as JSON
            },
            actionSuccess: {
                message: `Notification channel "${channel.name}" has been successfully updated.`,
                messageParams: {id: channel.id},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to update notification channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {id: ""},
            },
        };
    }
});
