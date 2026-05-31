import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiV1Fetch } from "../http-client";

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

export function registerAgentTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_agents",
    "List all agents accessible to the authenticated user",
    {},
    async () => {
      const result = await apiV1Fetch("/api/v1/agents", { method: "GET" }, apiKey);
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "get_agent",
    "Get details for a specific agent, including its associated databases",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(`/api/v1/agents/${id}`, { method: "GET" }, apiKey);
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "create_agent",
    "Create a new agent, optionally scoped to an organization",
    {
      name: z.string().min(1).describe("Agent name"),
      organizationId: z
        .string()
        .uuid()
        .optional()
        .describe("Organization ID to scope the agent to (optional)"),
    },
    async ({ name, organizationId }) => {
      const result = await apiV1Fetch(
        "/api/v1/agents",
        { method: "POST", body: JSON.stringify({ name, organizationId }) },
        apiKey
      );
      return result.ok ? ok(result.data) : err(result.error);
    }
  );

  server.tool(
    "delete_agent",
    "Delete an agent by ID",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(`/api/v1/agents/${id}`, { method: "DELETE" }, apiKey);
      return result.ok
        ? ok({ message: `Agent ${id} deleted successfully` })
        : err(result.error);
    }
  );

  server.tool(
    "get_agent_key",
    "Get the edge key for an agent (used by the agent to authenticate with Portabase)",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(`/api/v1/agents/${id}/key`, { method: "GET" }, apiKey);
      return result.ok ? ok(result.data) : err(result.error);
    }
  );
}
