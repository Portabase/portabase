import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok } from "@/lib/mcp/tools/response";
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
    "get_database",
    "Get details for a specific database",
    { id: z.string().describe("Database ID") },
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
    { id: z.string().describe("Database ID") },
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
      id: z.string().describe("Database ID"),
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
    { id: z.string().describe("Database ID") },
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
      id: z.string().describe("Database ID"),
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
}
