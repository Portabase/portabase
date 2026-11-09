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
import { unsupportedSnapshotPattern } from "@/features/database/utils/backup-engine";
import { engineFromWire, splitMethod } from "@/features/database/utils/backup-method";

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

    // The method lives in backupEngine, never in the stored config.
    const { config: nextConfig, method } = splitMethod(pruneAgentConfig(data.config as Record<string, unknown>));
    const hasMethod = data.dbms === "files" || data.dbms === "postgresql-cluster";

    if (databaseId) {
      const existing = await db.query.database.findFirst({
        where: and(
          eq(drizzleDb.schemas.database.id, databaseId),
          eq(drizzleDb.schemas.database.agentId, agentId),
        ),
      });
      if (!existing) throw new ActionError("Database not found");

      const engine = existing.backupEngine;
      const changesMethod =
        (!hasMethod && engine !== "archive") ||
        (hasMethod && method !== undefined && engineFromWire(method) !== engine);
      if (changesMethod) throw new ActionError("The backup method cannot be changed after creation.");
      const badPattern = engine === "restic" ? unsupportedSnapshotPattern(nextConfig) : undefined;
      if (badPattern) {
        throw new ActionError(`Exclude pattern "${badPattern}": brace patterns {a,b} are not supported in Snapshots mode.`);
      }

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

    const engine = hasMethod ? (engineFromWire(method) ?? "archive") : "archive";
    const badPattern = engine === "restic" ? unsupportedSnapshotPattern(nextConfig) : undefined;
    if (badPattern) {
      throw new ActionError(`Exclude pattern "${badPattern}": brace patterns {a,b} are not supported in Snapshots mode.`);
    }

    const config = encryptConfigSecrets(data.dbms, nextConfig, undefined, masterKey);

    const [created] = await db
      .insert(drizzleDb.schemas.database)
      .values({
        agentId,
        name: data.name,
        dbms: data.dbms,
        config,
        backupEngine: engine,
        ...(agentDatabaseId ? { agentDatabaseId } : {}),
      })
      .returning();
    return created;
  });
