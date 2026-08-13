"use server";

import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq } from "drizzle-orm";
import { userAction, ActionError } from "@/lib/safe-actions/actions";
import { withUpdatedAt } from "@/db/utils";
import {
  DatabaseConfigFormSchema,
  pruneAgentConfig,
} from "@/features/database/schemas/database-config.schema";
import { assertCanManageAgentDatabases } from "@/features/database/utils/database-acl";
import { getMasterServerKeyContent } from "@/features/agents/utils/keys.server";
import { encryptConfigSecrets } from "@/features/database/utils/credential-crypto";

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

    let masterKey: Buffer;
    try {
      masterKey = await getMasterServerKeyContent();
    } catch {
      throw new ActionError("Encryption key unavailable; cannot store credentials");
    }

    const nextConfig = pruneAgentConfig(data.config as Record<string, unknown>);

    if (databaseId) {
      const existing = await db.query.database.findFirst({
        where: and(
          eq(drizzleDb.schemas.database.id, databaseId),
          eq(drizzleDb.schemas.database.agentId, agentId),
        ),
      });
      if (!existing) throw new ActionError("Database not found");

      const config = encryptConfigSecrets(
        data.dbms,
        nextConfig,
        existing.config as Record<string, unknown> | null,
        masterKey,
      );

      const [updated] = await db
        .update(drizzleDb.schemas.database)
        .set(withUpdatedAt({ name: data.name, dbms: data.dbms, config }))
        .where(and(
          eq(drizzleDb.schemas.database.id, databaseId),
          eq(drizzleDb.schemas.database.agentId, agentId),
        ))
        .returning();
      if (!updated) throw new ActionError("Database not found");
      return updated;
    }

    const config = encryptConfigSecrets(data.dbms, nextConfig, undefined, masterKey);

    const [created] = await db
      .insert(drizzleDb.schemas.database)
      .values({
        agentId,
        name: data.name,
        dbms: data.dbms,
        config,
        ...(agentDatabaseId ? { agentDatabaseId } : {}),
      })
      .returning();
    return created;
  });
