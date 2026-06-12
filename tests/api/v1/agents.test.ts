import { readContext } from "../helpers/context";
import { ApiHttpClient } from "../helpers/http-client";

function requireApiKey() {
  const context = readContext();

  if (!context.apiKey) {
    throw new Error(
      "Authenticated API tests require AUTH_DEFAULT_USER and AUTH_DEFAULT_PASSWORD.",
    );
  }

  return context;
}

describe("api v1 agents", () => {
  const context = requireApiKey();
  const client = new ApiHttpClient(context.baseUrl);
  const api = client.withApiKey(context.apiKey);

  it("lists accessible agents", async () => {
    const { response, json } = await api.get("/api/v1/agents");
    expect(response.status).toBe(200);

    const payload = json as { data: Array<{ id: string }> };
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data.some((agent) => agent.id === context.agentId)).toBe(
      true,
    );
  });

  it("returns one agent by id", async () => {
    const { response, json } = await api.get(`/api/v1/agents/${context.agentId}`);
    expect(response.status).toBe(200);
    expect((json as { data: { id: string } }).data.id).toBe(context.agentId);
  });

  it("returns an edge key for the discovered agent", async () => {
    const { response, json } = await api.get(
      `/api/v1/agents/${context.agentId}/key`,
    );
    expect(response.status).toBe(200);
    expect(typeof (json as { data: string }).data).toBe("string");
  });

  it("returns 404 for an unknown agent id", async () => {
    const { response, json } = await api.get(
      "/api/v1/agents/11111111-1111-1111-1111-111111111111",
    );
    expect(response.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
});
