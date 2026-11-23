import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { withUpdatedAt } from "@/db/utils";
import { type DatabaseConfigFormType, pruneAgentConfig } from "@/features/database/schemas/database-config.schema";
import { getMasterServerKeyContent } from "@/features/agents/utils/keys.server";
import { encryptConfigSecrets } from "@/features/database/utils/credential-crypto";
import { unsupportedSnapshotPattern } from "@/features/database/utils/backup-engine";
import { engineFromWire, splitMethod } from "@/features/database/utils/backup-method";
import {
  agentSupportsDatabaseConfig,
  agentSupportsFiles,
  agentSupportsPhysical,
  MIN_DATABASE_CONFIG_AGENT_VERSION,
  MIN_FILES_AGENT_VERSION,
  MIN_PHYSICAL_AGENT_VERSION,
} from "@/features/agents/utils/version";

export class DatabaseConfigError extends Error {
  constructor(message: string, readonly status: 404 | 422 | 500 = 422) {
    super(message);
  }
}

export async function upsertDatabaseConfig({
  agentId,
  databaseId,
  agentDatabaseId,
  data,
}: {
  agentId: string;
  databaseId?: string;
  agentDatabaseId?: string;
  data: DatabaseConfigFormType;
}) {
  let masterKey: Buffer;
  try {
    masterKey = await getMasterServerKeyContent();
  } catch {
    throw new DatabaseConfigError("Encryption key unavailable; cannot store credentials", 500);
  }

  const { config: nextConfig, method } = splitMethod(pruneAgentConfig(data.config as Record<string, unknown>));
  const hasMethod = data.dbms === "files" || data.dbms === "postgresql-cluster";

  if (databaseId) {
    const existing = await db.query.database.findFirst({
      where: and(
        eq(drizzleDb.schemas.database.id, databaseId),
        eq(drizzleDb.schemas.database.agentId, agentId),
      ),
    });
    if (!existing) throw new DatabaseConfigError("Database not found", 404);

    const engine = existing.backupEngine;
    const changesMethod =
      (!hasMethod && engine !== "archive") ||
      (hasMethod && method !== undefined && engineFromWire(method) !== engine);
    if (changesMethod) throw new DatabaseConfigError("The backup method cannot be changed after creation.");
    const badPattern = engine === "restic" ? unsupportedSnapshotPattern(nextConfig) : undefined;
    if (badPattern) {
      throw new DatabaseConfigError(`Exclude pattern "${badPattern}": brace patterns {a,b} are not supported in Snapshots mode.`);
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
    if (!updated) throw new DatabaseConfigError("Database not found", 404);
    return updated;
  }

  const engine = hasMethod ? (engineFromWire(method) ?? "archive") : "archive";
  const agent = await db.query.agent.findFirst({
    where: eq(drizzleDb.schemas.agent.id, agentId),
    columns: { version: true },
  });
  if (!agent) throw new DatabaseConfigError("Agent not found", 404);
  if (!agentSupportsDatabaseConfig(agent.version)) {
    throw new DatabaseConfigError(`Declaring databases from the dashboard requires agent ${MIN_DATABASE_CONFIG_AGENT_VERSION} or later`);
  }
  if (data.dbms === "files" && !agentSupportsFiles(agent.version)) {
    throw new DatabaseConfigError(`Files sources require agent ${MIN_FILES_AGENT_VERSION} or later`);
  }
  if (engine === "physical" && !agentSupportsPhysical(agent.version)) {
    throw new DatabaseConfigError(`Physical backups require agent ${MIN_PHYSICAL_AGENT_VERSION} or later`);
  }
  const badPattern = engine === "restic" ? unsupportedSnapshotPattern(nextConfig) : undefined;
  if (badPattern) {
    throw new DatabaseConfigError(`Exclude pattern "${badPattern}": brace patterns {a,b} are not supported in Snapshots mode.`);
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
}
