import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok } from "@/lib/mcp/tools/response";
import { RetentionSettingsSchema } from "@/features/database/schemas/retention-policy.schema";
import { apiV1Fetch } from "@/lib/mcp/http-client";

export function registerDatabaseTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_databases",
    "List all databases accessible to the authenticated user",
    {},
    async () => {
      const result = await apiV1Fetch(
        "/api/v1/databases",
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "create_database",
    "Declare a database on an agent, like Add database on the agent page. The agent receives the configuration at its next ping. config takes the keys of a databases.json entry (host, port, username, password, database, options...); options.method picks the backup method of files and postgresql-cluster sources and cannot be changed later.",
    {
      agentId: z.uuid().describe("Agent ID"),
      projectId: z.uuid().optional().describe("Project to attach the database to"),
      name: z.string().describe("Display name"),
      dbms: z
        .enum(["postgresql", "postgresql-cluster", "mysql", "mariadb", "mongodb", "sqlite", "redis", "valkey", "firebird", "mssql", "docker-volume", "files"])
        .describe("Engine"),
      config: z.record(z.string(), z.unknown()).describe("Connection settings for the engine"),
    },
    async (input) => {
      const result = await apiV1Fetch(
        "/api/v1/databases",
        { method: "POST", body: JSON.stringify(input) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_database",
    "Get details for a specific database",
    { id: z.uuid().describe("Database ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_database_status",
    "Get the current status of a database, including latest backup and restoration state",
    { id: z.uuid().describe("Database ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}/status`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "attach_database_to_project",
    "Attach a database to a project. The database's agent must belong to the project's organization.",
    {
      id: z.uuid().describe("Database ID"),
      projectId: z.string().describe("Target project ID"),
    },
    async ({ id, projectId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}`,
        { method: "PATCH", body: JSON.stringify({ projectId }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "detach_database_from_project",
    "Detach a database from its project. Clears its backup schedule and removes its retention, alert and storage policies.",
    { id: z.uuid().describe("Database ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}`,
        { method: "PATCH", body: JSON.stringify({ projectId: null }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "set_database_backup_policy",
    "Set or clear a database's backup schedule. Provide a cron expression, or an empty string to clear it (which also drops the retention policy).",
    {
      id: z.uuid().describe("Database ID"),
      backupPolicy: z
        .string()
        .describe("A valid cron expression, or an empty string to clear the schedule"),
    },
    async ({ id, backupPolicy }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}/backup-policy`,
        { method: "PUT", body: JSON.stringify({ backupPolicy }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "set_database_full_backup_policy",
    "Physical sources only: set or clear the full backup schedule. The first backup at or after each occurrence is a full one that starts a new chain; while it is set, the agent's full_every_days is not applied.",
    {
      id: z.uuid().describe("Database ID"),
      fullBackupPolicy: z
        .string()
        .describe("A 5-field cron expression, or an empty string to clear the schedule"),
    },
    async ({ id, fullBackupPolicy }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}/full-backup-policy`,
        { method: "PUT", body: JSON.stringify({ fullBackupPolicy }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "set_database_retention_policy",
    "Create or update a database's own retention policy (overrides the project's). The database must have its own backup schedule.",
    {
      id: z.uuid().describe("Database ID"),
      ...RetentionSettingsSchema.shape,
    },
    async ({ id, ...settings }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${id}/retention-policy`,
        { method: "PUT", body: JSON.stringify(settings) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );
}
