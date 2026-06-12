import { ApiHttpClient } from "../helpers/http-client";

const baseUrl = process.env.PROJECT_URL;

if (!baseUrl) {
  throw new Error("PROJECT_URL is required");
}

describe("api v1 auth middleware", () => {
  const client = new ApiHttpClient(baseUrl);

  it("rejects missing api keys", async () => {
    const { response, json } = await client.request("GET", "/api/v1/agents");
    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Missing API key" });
  });

  it("rejects invalid api keys", async () => {
    const { response, json } = await client.request("GET", "/api/v1/agents", undefined, {
      "x-api-key": "sk_invalid",
    });
    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Invalid or expired API key" });
  });
});
