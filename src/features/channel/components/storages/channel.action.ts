"use server";

import { z } from "zod";
import { ServerActionResult } from "@/types/action-type";
import * as drizzleDb from "@/db";
import { userAction } from "@/lib/safe-actions/actions";
import { assertCanManageOrganization } from "@/lib/acl/organization-guard";
import { User } from "@/db/schema/02_user";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { StorageChannelFormSchema } from "@/features/channel/schemas/channel-form.schema";
import { StorageChannel } from "@/db/schema/12_storage-channel";
import {
  createChannelService,
  deleteChannelService,
  updateChannelService,
} from "@/features/channel/services/channel.service";

/** Instance channels: instance admins; organization channels: that organization's owners/admins. */
async function authorizeChannel(user: User, id: string) {
  const channel = await db.query.storageChannel.findFirst({
    columns: { organizationId: true },
    where: eq(drizzleDb.schemas.storageChannel.id, id),
  });
  await assertCanManageOrganization(user, channel?.organizationId);
}

export const addStorageChannelAction = userAction
  .inputSchema(
    z.object({
      organizationId: z.string().optional(),
      data: StorageChannelFormSchema,
    }),
  )
  .action(
    async ({ parsedInput, ctx }): Promise<ServerActionResult<StorageChannel>> => {
      const { organizationId, data } = parsedInput;
      await assertCanManageOrganization(ctx.user, organizationId);

      try {
        const channel = await createChannelService("storage", organizationId ?? null, data);

        return {
          success: true,
          value: {
            ...channel,
            config: channel.config as JSON,
          },
          actionSuccess: {
            message: "Storage channel has been successfully created.",
            messageParams: { id: channel.id },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to create storage channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { id: "" },
          },
        };
      }
    },
  );

export const removeStorageChannelAction = userAction
  .inputSchema(
    z.object({
      organizationId: z.string().optional(),
      id: z.string(),
    }),
  )
  .action(
    async ({ parsedInput, ctx }): Promise<ServerActionResult<StorageChannel>> => {
      const { id } = parsedInput;
      await authorizeChannel(ctx.user, id);

      try {
        const deletedChannel = await deleteChannelService("storage", id);

        if (!deletedChannel) {
          return {
            success: false,
            actionError: {
              message: "Storage channel not found.",
              status: 404,
              messageParams: { id: id },
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
            message: "Storage channel has been successfully removed.",
            messageParams: { id: id },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to remove storage channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { id: id },
          },
        };
      }
    },
  );

export const updateStorageChannelAction = userAction
  .inputSchema(
    z.object({
      id: z.string(),
      data: StorageChannelFormSchema,
    }),
  )
  .action(
    async ({ parsedInput, ctx }): Promise<ServerActionResult<StorageChannel>> => {
      const { id, data } = parsedInput;
      await authorizeChannel(ctx.user, id);

      try {
        const channel = await updateChannelService("storage", id, {
          provider: data.provider,
          name: data.name,
          config: data.config,
          enabled: data.enabled ?? true,
        });

        if (!channel) {
          return {
            success: false,
            actionError: {
              message: "Storage channel not found.",
              status: 404,
              messageParams: { id: id },
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
            message: `Storage channel "${channel.name}" has been successfully updated.`,
            messageParams: { id: channel.id },
          },
        };
      } catch (_error) {
        const error = _error;
        return {
          success: false,
          actionError: {
            message: "Failed to update storage channel.",
            status: 500,
            cause: error instanceof Error ? error.message : "Unknown error",
            messageParams: { id: "" },
          },
        };
      }
    },
  );
