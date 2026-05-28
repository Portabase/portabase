import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";

const AgentSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    version: z.string().nullable(),
    name: z.string(),
    healthErrorCount: z.number().int().nullable(),
    description: z.string(),
    isArchived: z.boolean().nullable(),
    lastContact: z.string().datetime().nullable(),
    organizationId: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().nullable(),
    deletedAt: z.string().datetime().nullable(),
  })
  .openapi("Agent");

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];

const ErrorSchema = z.object({ error: z.string() });

export function registerAgentRoutes(registry: OpenAPIRegistry) {
  registry.register("Agent", AgentSchema);

  registry.registerPath({
    method: "get",
    path: "/agents",
    summary: "List agents",
    security,
    responses: {
      200: {
        description: "List of accessible agents",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(AgentSchema) }),
          },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/agents",
    summary: "Create an agent",
    security,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1).openapi({ example: "my-agent" }),
              organizationId: z.string().uuid().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Agent created",
        content: {
          "application/json": { schema: z.object({ data: AgentSchema }) },
        },
      },
      400: {
        description: "Bad request",
        content: { "application/json": { schema: ErrorSchema } },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      403: {
        description: "Forbidden — organization not accessible",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Invalid request body",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/agents/{id}",
    summary: "Get agent by ID",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Agent details",
        content: {
          "application/json": { schema: z.object({ data: AgentSchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Agent not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/agents/{id}",
    summary: "Delete agent",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      204: { description: "Agent deleted" },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Agent not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/agents/{id}/key",
    summary: "Get agent edge key",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Agent edge key string",
        content: {
          "application/json": { schema: z.object({ data: z.string() }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Agent not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });
}
