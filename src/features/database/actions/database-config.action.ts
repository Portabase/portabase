"use server";

import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq } from "drizzle-orm";
import { userAction, ActionError } from "@/lib/safe-actions/actions";
import { withUpdatedAt } from "@/db/utils";
import { DatabaseConfigFormSchema } from "@/features/database/schemas/database-config.schema";
import { assertCanManageAgentDatabases } from "@/features/database/utils/database-acl";

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
    const { agentId, databaseId, agentDatabaseId, data } = parsedInput;

    try {
      await assertCanManageAgentDatabases(agentId);
    } catch (e) {
      throw new ActionError(e instanceof Error ? e.message : "Not authorized");
    }

    if (databaseId) {
      const [updated] = await db
        .update(drizzleDb.schemas.database)
        .set(withUpdatedAt({ name: data.name, dbms: data.dbms, config: data.config }))
        .where(and(
          eq(drizzleDb.schemas.database.id, databaseId),
          eq(drizzleDb.schemas.database.agentId, agentId),
        ))
        .returning();
      if (!updated) throw new ActionError("Database not found");
      return updated;
    }

    const [created] = await db
      .insert(drizzleDb.schemas.database)
      .values({
        agentId,
        name: data.name,
        dbms: data.dbms,
        config: data.config,
        ...(agentDatabaseId ? { agentDatabaseId } : {}),
      })
      .returning();
    return created;
  });
