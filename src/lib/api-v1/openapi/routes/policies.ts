import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Policies"];

const ErrorSchema = z.object({ error: z.string() });

export function registerPolicyRoutes(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: "patch",
    path: "/databases/{id}",
    tags,
    summary: "Update database fields or reassign its project",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              projectId: z.string().uuid().optional(),
              name: z.string().min(1).optional(),
              description: z.string().nullable().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated database",
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
        description: "Database or project not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Invalid request body, or agent is not attached to the project's organization",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/databases/{id}/backup-policy",
    tags,
    summary: "Set or clear the backup schedule for a database",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              backupPolicy: z
                .string()
                .describe("A valid cron expression, or \"\" to clear the schedule"),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated database record",
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
        description: "Database not found",
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
}
