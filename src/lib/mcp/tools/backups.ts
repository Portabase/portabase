import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { err, ok } from "@/lib/mcp/tools/response";
import { apiV1Fetch } from "@/lib/mcp/http-client";

export function registerBackupTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_backups",
    "List all backups for a specific database, ordered by most recent first",
    { databaseId: z.string().describe("Database ID") },
    async ({ databaseId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
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
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "trigger_backup",
    "Trigger an immediate backup for a database. Returns 409 if a backup is already running.",
    { databaseId: z.string().describe("Database ID") },
    async ({ databaseId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup`,
        { method: "POST", body: JSON.stringify({}) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "trigger_restore",
    "Trigger a database restore from a specific backup storage. Use get_backup to find available backupStorageId values. Returns 409 if a restore is already running.",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().uuid().describe("Backup ID"),
      backupStorageId: z
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
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "list_restorations",
    "List the restorations of a database, most recent first",
    { databaseId: z.string().describe("Database ID") },
    async ({ databaseId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/restore`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_backup_logs",
    "Get the job logs of a backup, oldest first",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ databaseId, backupId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup/${backupId}/logs`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_restoration_logs",
    "Get the job logs of a restoration, oldest first",
    {
      databaseId: z.string().describe("Database ID"),
      restorationId: z.string().describe("Restoration ID"),
    },
    async ({ databaseId, restorationId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/restore/${restorationId}/logs`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "delete_backup",
    "Permanently delete a backup and every stored copy of it (files, snapshots, replicas). Cannot be undone.",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().describe("Backup ID"),
    },
    async ({ databaseId, backupId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup/${backupId}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_backup_download_url",
    "Get a short-lived signed URL (about one minute) to download one stored copy of a backup. Snapshots and replicas cannot be downloaded.",
    {
      databaseId: z.string().describe("Database ID"),
      backupId: z.string().describe("Backup ID"),
      backupStorageId: z.string().describe("Backup storage ID (see get_backup)"),
    },
    async ({ databaseId, backupId, backupStorageId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/backup/${backupId}/download?backupStorageId=${encodeURIComponent(backupStorageId)}`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "rerun_restoration",
    "Requeue a finished restoration. Refused while any restoration of the database is waiting or ongoing, or when its backup is no longer available.",
    {
      databaseId: z.string().describe("Database ID"),
      restorationId: z.string().describe("Restoration ID"),
    },
    async ({ databaseId, restorationId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/restore/${restorationId}/rerun`,
        { method: "POST" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "delete_restoration",
    "Permanently delete a restoration record and its logs.",
    {
      databaseId: z.string().describe("Database ID"),
      restorationId: z.string().describe("Restoration ID"),
    },
    async ({ databaseId, restorationId }) => {
      const result = await apiV1Fetch(
        `/api/v1/databases/${databaseId}/restore/${restorationId}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );
}
