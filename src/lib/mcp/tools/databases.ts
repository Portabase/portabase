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
}
