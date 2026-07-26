import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { registerSecuritySchemes } from "@/lib/api-v1/openapi/security";
import { registerAgentRoutes } from "@/lib/api-v1/openapi/routes/agents";
import { registerDatabaseRoutes } from "@/lib/api-v1/openapi/routes/databases";
import { registerOrganizationRoutes } from "@/lib/api-v1/openapi/routes/organizations";
import { registerProjectRoutes } from "@/lib/api-v1/openapi/routes/projects";
import { registerPolicyRoutes } from "@/lib/api-v1/openapi/routes/policies";

export function buildSpec() {
  const registry = new OpenAPIRegistry();

  registerSecuritySchemes(registry);
  registerAgentRoutes(registry);
  registerDatabaseRoutes(registry);
  registerOrganizationRoutes(registry);
  registerProjectRoutes(registry);
  registerPolicyRoutes(registry);

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
      { name: "Organizations", description: "Organization management" },
      { name: "Projects", description: "Project management" },
      { name: "Policies", description: "Backup, storage and retention policies" },
    ],
  });
}
