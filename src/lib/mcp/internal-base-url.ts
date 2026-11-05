/**
 * Base URL for MCP calls into this process.
 * PROJECT_URL is the public address. From inside the container it often
 * does not route back to nginx, so the tools use loopback instead.
 */
export function internalApiBaseUrl(): string {
  const override = process.env.API_INTERNAL_URL?.trim().replace(/\/$/, "");
  if (override) return override;

  const port = process.env.PORT?.trim() || "80";
  return `http://127.0.0.1:${port}`;
}
