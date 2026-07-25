import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { projectSchema } from "@/db/schema/06_project";

const datetimeNullable = z.string().datetime().nullable();
const datetime = z.string().datetime();
const commonTimestamps = {
  createdAt: datetime,
  updatedAt: datetimeNullable,
  deletedAt: datetimeNullable,
};

const ProjectSchema = z
  .object({
    ...projectSchema.shape,
    ...commonTimestamps,
  })
  .openapi("Project");

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Projects"];

const ErrorSchema = z.object({ error: z.string() });

export function registerProjectRoutes(registry: OpenAPIRegistry) {
  registry.register("Project", ProjectSchema);

  registry.registerPath({
    method: "get",
    path: "/projects/{id}",
    tags,
    summary: "Get project by ID",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Project details",
        content: {
          "application/json": { schema: z.object({ data: ProjectSchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Project not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/projects/{id}",
    tags,
    summary: "Update a project",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().min(1).optional(),
              slug: z.string().min(1).optional(),
              isArchived: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated project",
        content: {
          "application/json": { schema: z.object({ data: ProjectSchema }) },
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
        description: "Project not found",
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
    method: "delete",
    path: "/projects/{id}",
    tags,
    summary: "Archive (soft-delete) a project",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Archived project",
        content: {
          "application/json": { schema: z.object({ data: ProjectSchema }) },
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
        description: "Project not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });
}
