import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { createPortabaseMcpServer } from "@/lib/mcp/server";
import type { ApiKeyContext } from "@/lib/api-v1/types";
import { env } from "@/env.mjs";

/**
 * MCP endpoint — Streamable HTTP transport, stateless mode.
 *
 * Auth is handled by withApiKey before MCP is ever touched.
 * The validated key is forwarded by MCP tools to downstream /api/v1 REST calls.
 */
const apiEnabled = String(env.API_ENABLED) === "true";
const mcpEnabled = String(env.MCP_ENABLED) === "true";

export const POST = apiEnabled && mcpEnabled
  ? withApiKey(async (req: Request, ctx: ApiKeyContext) => {
      const apiKey = req.headers.get("x-api-key")!;

      const server = createPortabaseMcpServer(ctx, apiKey);

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);

      return transport.handleRequest(req);
    })
  : () => NextResponse.json({ error: "Not found" }, { status: 404 });
