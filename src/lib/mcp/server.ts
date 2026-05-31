import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiKeyContext } from "@/lib/api-v1/types";
import { registerAgentTools } from "./tools/agents";
import { registerDatabaseTools } from "./tools/databases";
import { registerBackupTools } from "./tools/backups";

/**
 * Creates a configured McpServer for a single request.
 * A new instance is created per request (stateless transport pattern).
 *
 * @param _ctx - The validated API key context (user + org memberships). Reserved for
 *               future tools that need server-side context beyond forwarded HTTP calls.
 * @param apiKey - The raw API key forwarded to all /api/v1 REST calls.
 */
export function createPortabaseMcpServer(
  _ctx: ApiKeyContext,
  apiKey: string
): McpServer {
  const server = new McpServer({
    name: "portabase",
    version: process.env.npm_package_version ?? "1.0.0",
  });

  registerAgentTools(server, apiKey);
  registerDatabaseTools(server, apiKey);
  registerBackupTools(server, apiKey);

  return server;
}
