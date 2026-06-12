import { ApiHttpClient } from "../helpers/http-client";

const baseUrl = process.env.PROJECT_URL;

if (!baseUrl) {
  throw new Error("PROJECT_URL is required");
}

describe("api v1 docs and spec", () => {
  const client = new ApiHttpClient(baseUrl);

  it("serves the OpenAPI document", async () => {
    const { response, json } = await client.request("GET", "/api/v1/openapi");
    expect(response.status).toBe(200);
    expect((json as { openapi: string }).openapi).toMatch(/^3\./);
  });

  it("serves the docs page", async () => {
    const { response, text } = await client.request("GET", "/api/v1/docs");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(text).toContain("<div id=\"swagger-ui\"></div>");
    expect(text).toContain("Portabase API Docs");
    expect(text).toContain("/api/v1/openapi");
  });
});
