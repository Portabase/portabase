"use server";

import { z } from "zod";
import { userAction, ActionError } from "@/lib/safe-actions/actions";
import { DatabaseConfigFormSchema } from "@/features/database/schemas/database-config.schema";
import { assertCanManageAgentDatabases } from "@/features/database/utils/database-acl";
import { DatabaseConfigError, upsertDatabaseConfig } from "@/features/database/services/database-config.service";

export const upsertDatabaseConfigAction = userAction
  .inputSchema(
    z.object({
      agentId: z.uuid(),
      databaseId: z.uuid().optional(),
      agentDatabaseId: z.uuid().optional(),
      data: DatabaseConfigFormSchema,
    }),
  )
  .action(async ({ parsedInput }) => {
    try {
      await assertCanManageAgentDatabases(parsedInput.agentId);
    } catch (e) {
      throw new ActionError(e instanceof Error ? e.message : "Not authorized");
    }

    try {
      return await upsertDatabaseConfig(parsedInput);
    } catch (error) {
      if (error instanceof DatabaseConfigError) throw new ActionError(error.message);
      throw error;
    }
  });
