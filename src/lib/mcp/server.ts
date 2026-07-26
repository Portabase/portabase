import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import type {ApiKeyContext} from "@/lib/api-v1/types";
import {registerAgentTools} from "./tools/agents";
import {registerDatabaseTools} from "./tools/databases";
import {registerBackupTools} from "./tools/backups";

export function createPortabaseMcpServer(
    _ctx: ApiKeyContext,
    apiKey: string,
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
