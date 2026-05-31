import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { withApiKey } from "@/lib/api-v1/middleware";
import { createPortabaseMcpServer } from "@/lib/mcp/server";
import type { ApiKeyContext } from "@/lib/api-v1/types";

/**
 * MCP endpoint — Streamable HTTP transport, stateless mode.
 *
 * Auth is handled by withApiKey before MCP is ever touched.
 * The validated key is forwarded by MCP tools to downstream /api/v1 REST calls.
 */
export const POST = withApiKey(async (req: Request, ctx: ApiKeyContext) => {
  // withApiKey already validated this — safe to assert non-null
  const apiKey = req.headers.get("x-api-key")!;

  const server = createPortabaseMcpServer(ctx, apiKey);

  // sessionIdGenerator: undefined = stateless (no sessions, no SSE subscriptions)
  // A new transport instance per request is required in stateless mode
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  return transport.handleRequest(req);
});
