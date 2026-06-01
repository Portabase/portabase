import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {err, ok} from "@/lib/mcp/tools/response";
import {apiV1Fetch} from "@/lib/mcp/http-client";

export function registerBackupTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_backups",
    "List all backups for a specific database, ordered by most recent first",
    { databaseId: z.string().describe("Database ID") },
    async ({ databaseId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup`,
        { method: "GET" },
        apiKey
      );
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "get_backup",
    "Get details for a specific backup, including its storage locations",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ databaseId, backupId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup/${backupId}`,
        { method: "GET" },
        apiKey
      );
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "trigger_backup",
    "Trigger an immediate backup for a database. Returns 409 if a backup is already running.",
    { databaseId: z.string().describe("Database ID") },
    async ({ databaseId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup`,
        { method: "POST", body: JSON.stringify({}) },
        apiKey
      );
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "trigger_restore",
    "Trigger a database restore from a specific backup storage. Use get_backup to find available backupStorageId values. Returns 409 if a restore is already running.",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().uuid().describe("Backup ID"),
      backupStorageId: z
        .string()
        .uuid()
        .describe("Backup storage ID (from get_backup storages list)"),
    },
    async ({ databaseId, backupId, backupStorageId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/restore`,
        {
          method: "POST",
          body: JSON.stringify({ backupId, backupStorageId }),
        },
        apiKey
      );
      return result.ok ? ok(result.data) : err(result.error);
    }
  );
}
