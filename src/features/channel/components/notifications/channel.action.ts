"use server";

import { z } from "zod";
import { ServerActionResult } from "@/types/action-type";
import * as drizzleDb from "@/db";
import { userAction } from "@/lib/safe-actions/actions";
import { assertCanManageOrganization } from "@/lib/acl/organization-guard";
import { User } from "@/db/schema/02_user";
import { NotificationChannel } from "@/db/schema/09_notification-channel";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { NotificationChannelFormSchema } from "@/features/channel/schemas/channel-form.schema";
import {
  createChannelService,
  deleteChannelService,
  updateChannelService,
} from "@/features/channel/services/channel.service";

/** Instance channels: instance admins; organization channels: that organization's owners/admins. */
async function authorizeChannel(user: User, id: string) {
  const channel = await db.query.notificationChannel.findFirst({
    columns: { organizationId: true },
    where: eq(drizzleDb.schemas.notificationChannel.id, id),
  });
  await assertCanManageOrganization(user, channel?.organizationId);
}

export const addNotificationChannelAction = userAction
  .inputSchema(
    z.object({
      organizationId: z.string().optional(),
      data: NotificationChannelFormSchema,
    }),
  )
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<ServerActionResult<NotificationChannel>> => {
      const { organizationId, data } = parsedInput;
      await assertCanManageOrganization(ctx.user, organizationId);
      try {
        const channel = await createChannelService(
          "notification",
          organizationId ?? null,
          data,
        );

        return {
          success: true,
          value: {
            ...channel,
            config: channel.config as JSON,
          },
          actionSuccess: {
            message: "Notification channel has been successfully created.",
            messageParams: { notificationChannelId: channel.id },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to create notification channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { notificationChannelId: "" },
          },
        };
      }
    },
  );

export const removeNotificationChannelAction = userAction
  .inputSchema(
    z.object({
      organizationId: z.string().optional(),
      notificationChannelId: z.string(),
    }),
  )
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<ServerActionResult<NotificationChannel>> => {
      const { notificationChannelId } = parsedInput;
      await authorizeChannel(ctx.user, notificationChannelId);

      try {
        const deletedChannel = await deleteChannelService(
          "notification",
          notificationChannelId,
        );

        if (!deletedChannel) {
          return {
            success: false,
            actionError: {
              message: "Notification channel not found.",
              status: 404,
              messageParams: { notificationChannelId: notificationChannelId },
            },
          };
        }

        return {
          success: true,
          value: {
            ...deletedChannel,
            config: deletedChannel.config as JSON,
          },
          actionSuccess: {
            message: "Notification channel has been successfully removed.",
            messageParams: { notificationChannelId: notificationChannelId },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to remove notification channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { notificationChannelId: notificationChannelId },
          },
        };
      }
    },
  );

export const updateNotificationChannelAction = userAction
  .inputSchema(
    z.object({
      id: z.string(),
      data: NotificationChannelFormSchema,
    }),
  )
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<ServerActionResult<NotificationChannel>> => {
      const { id, data } = parsedInput;
      await authorizeChannel(ctx.user, id);

      try {
        const channel = await updateChannelService("notification", id, {
          provider: data.provider,
          name: data.name,
          config: data.config,
          enabled: data.enabled ?? true,
        });

        if (!channel) {
          return {
            success: false,
            actionError: {
              message: "Notification channel not found.",
              status: 404,
              messageParams: { notificationChannelId: id },
            },
          };
        }

        return {
          success: true,
          value: {
            ...channel,
            config: channel.config as JSON,
          },
          actionSuccess: {
            message: `Notification channel "${channel.name}" has been successfully updated.`,
            messageParams: { id: channel.id },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to update notification channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { id: "" },
          },
        };
      }
    },
  );
