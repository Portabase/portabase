import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { organizationSchema } from "@/db/schema/03_organization";

const datetimeNullable = z.string().datetime().nullable();
const datetime = z.string().datetime();
const commonTimestamps = {
  createdAt: datetime,
  updatedAt: datetimeNullable,
  deletedAt: datetimeNullable,
};

const OrganizationSchema = z
  .object({
    ...organizationSchema.shape,
    ...commonTimestamps,
  })
  .openapi("Organization");

const UuidParam = z
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Organizations"];

const ErrorSchema = z.object({ error: z.string() });

export function registerOrganizationRoutes(registry: OpenAPIRegistry) {
  registry.register("Organization", OrganizationSchema);

  registry.registerPath({
    method: "post",
    path: "/organizations",
    tags,
    summary: "Create an organization",
    security,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1).openapi({ example: "Acme Inc" }),
              slug: z.string().min(1).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Organization created",
        content: {
          "application/json": { schema: z.object({ data: OrganizationSchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      403: {
        description: "Forbidden — user cannot create organizations",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Slug already exists",
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
    path: "/organizations",
    tags,
    summary: "List organizations for the current user",
    security,
    responses: {
      200: {
        description: "List of organizations the caller is a member of",
        content: {
          "application/json": { schema: z.object({ data: z.array(OrganizationSchema) }) },
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
    method: "get",
    path: "/organizations/{id}",
    tags,
    summary: "Get organization by ID",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Organization details",
        content: {
          "application/json": { schema: z.object({ data: OrganizationSchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Organization not found",
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
    path: "/organizations/{id}",
    tags,
    summary: "Delete an organization",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Organization soft-deleted",
        content: {
          "application/json": {
            schema: z.object({ data: z.object({ id: z.uuid() }) }),
          },
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
        description: "Organization not found",
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
    path: "/organizations/{id}/projects",
    tags,
    summary: "List projects for an organization",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "List of projects belonging to the organization",
        content: {
          "application/json": { schema: z.object({ data: z.array(z.any()) }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Organization not found",
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
    path: "/organizations/{id}/projects",
    tags,
    summary: "Create a project in an organization",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1).openapi({ example: "my-project" }),
              slug: z.string().min(1).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Project created",
        content: {
          "application/json": { schema: z.object({ data: z.any() }) },
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
        description: "Organization not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Slug already exists",
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
    path: "/organizations/{id}/agents",
    tags,
    summary: "List agents attached to an organization",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "List of agents attached to the organization",
        content: {
          "application/json": { schema: z.object({ data: z.array(z.any()) }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Organization not found",
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
    path: "/organizations/{id}/agents",
    tags,
    summary: "Attach an agent to an organization",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({ agentId: z.uuid() }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Agent attached to the organization",
        content: {
          "application/json": {
            schema: z.object({
              data: z.object({
                organizationId: z.uuid(),
                agentId: z.uuid(),
              }),
            }),
          },
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
        description: "Organization or agent not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Agent is already attached to this organization",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Agent is not a global agent",
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
    path: "/organizations/{id}/agents/{agentId}",
    tags,
    summary: "Detach an agent from an organization",
    security,
    request: {
      params: z.object({ id: UuidParam, agentId: UuidParam }),
    },
    responses: {
      200: {
        description: "Agent detached from the organization",
        content: {
          "application/json": {
            schema: z.object({
              data: z.object({
                organizationId: z.uuid(),
                agentId: z.uuid(),
              }),
            }),
          },
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
        description: "Organization not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });
}
