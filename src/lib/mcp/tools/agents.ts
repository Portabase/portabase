import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiV1Fetch } from "@/lib/mcp/http-client";
import { err, ok } from "@/lib/mcp/tools/response";

export function registerAgentTools(server: McpServer, apiKey: string) {
  server.tool(
    "list_agents",
    "List all agents accessible to the authenticated user",
    {},
    async () => {
      const result = await apiV1Fetch(
        "/api/v1/agents",
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "get_agent",
    "Get details for a specific agent, including its associated databases",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/agents/${id}`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "create_agent",
    "Create a new agent, optionally scoped to an organization",
    {
      name: z.string().min(1).describe("Agent name"),
      organizationId: z
        .uuid()
        .optional()
        .describe("Organization ID to scope the agent to (optional)"),
    },
    async ({ name, organizationId }) => {
      const result = await apiV1Fetch(
        "/api/v1/agents",
        { method: "POST", body: JSON.stringify({ name, organizationId }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "delete_agent",
    "Delete an agent by ID",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/agents/${id}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok
        ? ok({ message: `Agent ${id} deleted successfully` })
        : err(result.error);
    },
  );

  server.tool(
    "get_agent_key",
    "Get the edge key for an agent (used by the agent to authenticate with Portabase)",
    { id: z.string().describe("Agent ID") },
    async ({ id }) => {
      const result = await apiV1Fetch(
        `/api/v1/agents/${id}/key`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "list_organization_agents",
    "List the agents attached to an organization",
    { organizationId: z.string().describe("Organization ID") },
    async ({ organizationId }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${organizationId}/agents`,
        { method: "GET" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "attach_agent_to_organization",
    "Attach a global (system) agent to an organization. Requires system-admin privileges.",
    {
      organizationId: z.string().describe("Organization ID"),
      agentId: z.string().describe("Agent ID (must be a global/unattached agent)"),
    },
    async ({ organizationId, agentId }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${organizationId}/agents`,
        { method: "POST", body: JSON.stringify({ agentId }) },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );

  server.tool(
    "detach_agent_from_organization",
    "Detach an agent from an organization. Also unlinks that org's databases and removes their policies.",
    {
      organizationId: z.string().describe("Organization ID"),
      agentId: z.string().describe("Agent ID"),
    },
    async ({ organizationId, agentId }) => {
      const result = await apiV1Fetch(
        `/api/v1/organizations/${organizationId}/agents/${agentId}`,
        { method: "DELETE" },
        apiKey,
      );
      return result.ok ? ok(result.data) : err(result.error);
    },
  );
}
