import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiV1Fetch } from "@/lib/mcp/http-client";
import { err, ok } from "@/lib/mcp/tools/response";

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
}
