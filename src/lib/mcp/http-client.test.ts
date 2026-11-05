import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { apiV1Fetch } from "./http-client.ts";
import { internalApiBaseUrl } from "./internal-base-url.ts";

const originalFetch = globalThis.fetch;
const envKeys = ["PORT", "API_INTERNAL_URL", "PROJECT_URL"] as const;
const saved = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of envKeys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

test("loopback on port 80 when PORT and API_INTERNAL_URL are unset", () => {
  delete process.env.PORT;
  delete process.env.API_INTERNAL_URL;
  assert.equal(internalApiBaseUrl(), "http://127.0.0.1:80");
});

test("PORT selects the loopback port", () => {
  delete process.env.API_INTERNAL_URL;
  process.env.PORT = "3000";
  assert.equal(internalApiBaseUrl(), "http://127.0.0.1:3000");
});

test("API_INTERNAL_URL overrides loopback and drops a trailing slash", () => {
  process.env.PORT = "80";
  process.env.API_INTERNAL_URL = "http://10.0.0.8:8080/";
  assert.equal(internalApiBaseUrl(), "http://10.0.0.8:8080");
});

test("apiV1Fetch calls loopback and ignores PROJECT_URL", async () => {
  delete process.env.API_INTERNAL_URL;
  process.env.PORT = "80";
  process.env.PROJECT_URL = "https://portabase.oxem.dev";
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ data: { id: "db-1" } }), { status: 200 });
  }) as typeof fetch;

  const result = await apiV1Fetch("/api/v1/databases", { method: "GET" }, "sk_test");

  assert.equal(result.ok, true);
  assert.deepEqual(calls, ["http://127.0.0.1:80/api/v1/databases"]);
  if (result.ok) assert.deepEqual(result.data, { id: "db-1" });
});

test("apiV1Fetch reports a transport failure without calling the public host", async () => {
  delete process.env.API_INTERNAL_URL;
  process.env.PORT = "80";
  process.env.PROJECT_URL = "https://portabase.oxem.dev";
  globalThis.fetch = (async () => {
    throw new Error("connect ECONNREFUSED");
  }) as typeof fetch;

  const result = await apiV1Fetch("/api/v1/databases", { method: "GET" }, "sk_test");

  assert.deepEqual(result, {
    ok: false,
    status: 0,
    error: "Failed to reach internal API",
  });
});

test("apiV1Fetch rejects a path that would escape the API prefix", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("nope");
  }) as typeof fetch;

  const result = await apiV1Fetch("/api/v1/../admin", { method: "GET" }, "sk_test");

  assert.equal(called, false);
  assert.deepEqual(result, { ok: false, status: 400, error: "Invalid identifier" });
});
