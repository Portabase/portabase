import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiV1Fetch } from "@/lib/mcp/http-client";
import { err, ok } from "@/lib/mcp/tools/response";

export function registerOrganizationTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_organizations",
    "List organizations the authenticated user belongs to",
    {},
    async () => {
      const result = await apiV1Fetch(
        "/api/v1/organizations",
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_organization",
    "Get details for a specific organization",
    { id: z.string().describe("Organization ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${id}`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "create_organization",
    "Create a new organization; the authenticated user becomes its owner",
    {
      name: z.string().min(1).describe("Organization name"),
      slug: z
        .string()
        .min(1)
        .optional()
        .describe("Optional slug (defaults to a slugified name)"),
    },
    async ({ name, slug }) => {
      const result = await apiV1Fetch(
        "/api/v1/organizations",
        { method: "POST", body: JSON.stringify({ name, slug }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "delete_organization",
    "Delete an organization. Fails if it is the default organization or still has projects.",
    { id: z.string().describe("Organization ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${id}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok
        ? ok({ message: `Organization ${id} deleted successfully` })
        : err(result.error);
    },
  );
}
