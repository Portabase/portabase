import { readContext } from "../helpers/context";
import { ApiHttpClient } from "../helpers/http-client";

const baseUrl = process.env.PROJECT_URL;

if (!baseUrl) {
  throw new Error("PROJECT_URL is required");
}

describe("api v1 mcp", () => {
  const context = readContext();
  const client = new ApiHttpClient(baseUrl);

  it("rejects missing api key", async () => {
    const { response, json } = await client.request("POST", "/api/v1/mcp", {
      jsonrpc: "2.0",
      id: "1",
      method: "tools/list",
      params: {},
    });

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Missing API key" });
  });

  it("passes a valid api key through the middleware", async () => {
    if (!context.apiKey) {
      throw new Error(
        "Authenticated MCP coverage requires AUTH_DEFAULT_USER and AUTH_DEFAULT_PASSWORD.",
      );
    }

    const api = client.withApiKey(context.apiKey);
    const { response } = await api.post("/api/v1/mcp", {
      jsonrpc: "2.0",
      id: "1",
      method: "tools/list",
      params: {},
    });

    expect([200, 202, 400]).toContain(response.status);
  });
});
