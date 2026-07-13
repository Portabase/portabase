import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { registerSecuritySchemes } from "@/lib/api-v1/openapi/security";
import { registerAgentRoutes } from "@/lib/api-v1/openapi/routes/agents";
import { registerDatabaseRoutes } from "@/lib/api-v1/openapi/routes/databases";

export function buildSpec() {
  const registry = new OpenAPIRegistry();

  registerSecuritySchemes(registry);
  registerAgentRoutes(registry);
  registerDatabaseRoutes(registry);

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Portabase API",
      version: "1.0.0",
      description:
        "Authenticate all requests using the x-api-key header with an API key generated from the Portabase dashboard.",
    },
    servers: [{ url: "/api/v1" }],
    security: [{ apiKeyAuth: [] }],
    tags: [
      { name: "Agents", description: "Agent management" },
      { name: "Databases", description: "Database management and backup operations" },
    ],
  });
}
