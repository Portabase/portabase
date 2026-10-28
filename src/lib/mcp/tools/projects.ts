import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiV1Fetch } from "@/lib/mcp/http-client";
import { err, ok } from "@/lib/mcp/tools/response";
import { RetentionSettingsSchema } from "@/features/database/schemas/retention-policy.schema";

export function registerProjectTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_projects",
    "List the projects of an organization",
    { organizationId: z.string().describe("Organization ID") },
    async ({ organizationId }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${organizationId}/projects`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "create_project",
    "Create a new project within an organization",
    {
      organizationId: z.string().describe("Organization ID"),
      name: z.string().min(1).describe("Project name"),
      slug: z
        .string()
        .min(1)
        .optional()
        .describe("Optional slug (defaults to a slugified name)"),
    },
    async ({ organizationId, name, slug }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${organizationId}/projects`,
        { method: "POST", body: JSON.stringify({ name, slug }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_project",
    "Get details for a specific project",
    { id: z.string().describe("Project ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/projects/${id}`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "archive_project",
    "Archive a project. Detaches its databases (clearing their schedule) and removes their policies.",
    { id: z.string().describe("Project ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/projects/${id}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "set_project_backup_policy",
    "Set or clear a project's default backup schedule, inherited by its databases that have none. Provide a cron expression, or an empty string to clear it (which also drops the project's retention policy).",
    {
      id: z.string().describe("Project ID"),
      backupPolicy: z
        .string()
        .describe("A valid cron expression, or an empty string to clear the schedule"),
    },
    async ({ id, backupPolicy }) => {
      const result = await apiV1Fetch(
        `/api/v1/projects/${id}/backup-policy`,
        { method: "PUT", body: JSON.stringify({ backupPolicy }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "set_project_retention_policy",
    "Create or update a project's retention policy, inherited by its databases that have none. The project must have its own backup schedule.",
    {
      id: z.string().describe("Project ID"),
      ...RetentionSettingsSchema.shape,
    },
    async ({ id, ...settings }) => {
      const result = await apiV1Fetch(
        `/api/v1/projects/${id}/retention-policy`,
        { method: "PUT", body: JSON.stringify(settings) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );
}
