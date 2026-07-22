"use server";
import { action } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { ServerActionResult } from "@/types/action-type";
import { Backup } from "@/db/schema/07_database";
import { deleteBackupService } from "@/lib/tasks/database/utils/backup-delete.service";

export const deleteBackupCronAction = action
  .schema(
    z.object({
      backupId: z.string(),
      databaseId: z.string(),
    }),
  )
  .action(async ({ parsedInput }): Promise<ServerActionResult<Backup>> => {
    try {
      const result = await deleteBackupService(
        parsedInput.backupId,
        parsedInput.databaseId,
      );

      if (!result.ok) {
        return {
          success: false,
          actionError: {
            message: "Backup not found.",
            status: 404,
            messageParams: { backupId: parsedInput.backupId },
          },
        };
      }

      return {
        success: true,
        actionSuccess: {
          message: `Backup deleted successfully (${parsedInput.backupId}).`,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        actionError: {
          message: `Failed to delete backup(${parsedInput.backupId}).`,
          status: 500,
          cause: error instanceof Error ? error.message : "Unknown error",
          messageParams: { message: "Error deleting the backup" },
        },
      };
    }
  });
