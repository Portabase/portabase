"use server";

import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";
import {db} from "@/db";
import {and, eq} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {
    StorageChannelFormSchema
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/channel-form.schema";
import {StorageChannel} from "@/db/schema/12_storage-channel";


export const addStorageChannelAction = userAction.schema(
    z.object({
        organizationId: z.string().optional(),
        data: StorageChannelFormSchema
    })
).action(async ({parsedInput}): Promise<ServerActionResult<StorageChannel>> => {
    const {organizationId, data} = parsedInput;

    try {
        const [channel] = await db
            .insert(drizzleDb.schemas.storageChannel)
            .values({
                provider: data.provider,
                name: data.name,
                config: data.config,
                enabled: data.enabled ?? true,
            })
            .returning();

        if (organizationId) {
            await db.insert(drizzleDb.schemas.organizationStorageChannel).values({
                organizationId,
                storageChannelId: channel.id,
            });
        }

        return {
            success: true,
            value: {
                ...channel,
                config: channel.config as JSON
            },
            actionSuccess: {
                message: "Storage channel has been successfully created.",
                messageParams: {id: channel.id},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to create storage channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {id: ""},
            },
        };
    }
});

export const removeStorageChannelAction = userAction.schema(
    z.object({
        organizationId: z.string().optional(),
        id: z.string(),
    })
).action(async ({parsedInput}): Promise<ServerActionResult<StorageChannel>> => {
    const {organizationId, id} = parsedInput;

    try {
        if (organizationId) {
            await db
                .delete(drizzleDb.schemas.organizationNotificationChannel)
                .where(
                    and(
                        eq(drizzleDb.schemas.organizationStorageChannel.organizationId, organizationId),
                        eq(drizzleDb.schemas.organizationStorageChannel.storageChannelId, id)
                    )
                );
        }

        const [deletedChannel] = await db
            .delete(drizzleDb.schemas.storageChannel)
            .where(eq(drizzleDb.schemas.storageChannel.id, id))
            .returning();

        if (!deletedChannel) {
            return {
                success: false,
                actionError: {
                    message: "Storage channel not found.",
                    status: 404,
                    messageParams: {id: id},
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
                message: "Storage channel has been successfully removed.",
                messageParams: {id: id},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to remove storage channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {id: id},
            },
        };
    }
});


export const updateStorageChannelAction = userAction.schema(
    z.object({
        id: z.string(),
        data: StorageChannelFormSchema
    })
).action(async ({parsedInput}): Promise<ServerActionResult<StorageChannel>> => {
    const {id, data} = parsedInput;

    try {
        const [channel] = await db
            .update(drizzleDb.schemas.storageChannel)
            .set(withUpdatedAt({
                provider: data.provider,
                name: data.name,
                config: data.config,
                enabled: data.enabled ?? true,
            }))
            .where(eq(drizzleDb.schemas.storageChannel.id, id))
            .returning();

        return {
            success: true,
            value: {
                ...channel,
                config: channel.config as JSON
            },
            actionSuccess: {
                message: `Storage channel "${channel.name}" has been successfully updated.`,
                messageParams: {id: channel.id},
            },
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            success: false,
            actionError: {
                message: "Failed to update storage channel.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
                messageParams: {id: ""},
            },
        };
    }
});
