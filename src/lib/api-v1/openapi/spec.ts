import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { registerSecuritySchemes } from "@/lib/api-v1/openapi/security";
import { registerAgentRoutes } from "@/lib/api-v1/openapi/routes/agents";
import { registerDatabaseRoutes } from "@/lib/api-v1/openapi/routes/databases";
import { registerOrganizationRoutes } from "@/lib/api-v1/openapi/routes/organizations";
import { registerProjectRoutes } from "@/lib/api-v1/openapi/routes/projects";
import { registerPolicyRoutes } from "@/lib/api-v1/openapi/routes/policies";

const RATE_LIMITED = {
  description: "Rate limit reached for this API key (1000 requests per hour); details.tryAgainIn is the wait in milliseconds",
  content: {
    "application/json": {
      schema: {
        type: "object" as const,
        properties: {
          error: { type: "string" as const },
          details: { type: "object" as const, properties: { tryAgainIn: { type: "number" as const } } },
        },
      },
    },
  },
};

export function buildSpec() {
  const registry = new OpenAPIRegistry();

  registerSecuritySchemes(registry);
  registerAgentRoutes(registry);
  registerDatabaseRoutes(registry);
  registerOrganizationRoutes(registry);
  registerProjectRoutes(registry);
  registerPolicyRoutes(registry);

  const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
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
      { name: "Organizations", description: "Organization management" },
      { name: "Projects", description: "Project management" },
      { name: "Policies", description: "Backup schedule and retention policies" },
    ],
  });

  for (const pathItem of Object.values(document.paths)) {
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const operation = pathItem[method];
      if (operation) operation.responses["429"] = RATE_LIMITED;
    }
  }

  return document;
}
