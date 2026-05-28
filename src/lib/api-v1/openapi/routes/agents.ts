import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import {AgentSchema} from "@/features/agents/agents.schema";
import {agentSchema} from "@/db/schema/08_agent";

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Agents"];

const ErrorSchema = z.object({ error: z.string() });

export function registerAgentRoutes(registry: OpenAPIRegistry) {
  registry.register("Agent", z.object(agentSchema.shape).openapi("Agent"));

  registry.registerPath({
    method: "get",
    path: "/agents",
    tags,
    summary:"List agents",
    security,
    responses: {
      200: {
        description: "List of accessible agents",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(agentSchema) }),
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
    tags,
    summary:"Create an agent",
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
    tags,
    summary:"Get agent by ID",
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
    tags,
    summary:"Delete agent",
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
    tags,
    summary:"Get agent edge key",
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
