import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { retentionPolicySchema } from "@/db/schema/07_database";
import { storagePolicySchema } from "@/db/schema/13_storage-policy";

const datetimeNullable = z.string().datetime().nullable();
const datetime = z.string().datetime();
const commonTimestamps = {
  createdAt: datetime,
  updatedAt: datetimeNullable,
  deletedAt: datetimeNullable,
};

const RetentionPolicySchema = z
  .object({
    ...retentionPolicySchema.shape,
    ...commonTimestamps,
  })
  .openapi("RetentionPolicy");

const StoragePolicySchema = z
  .object({
    ...storagePolicySchema.shape,
    ...commonTimestamps,
  })
  .openapi("StoragePolicy");

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Policies"];

const ErrorSchema = z.object({ error: z.string() });

export function registerPolicyRoutes(registry: OpenAPIRegistry) {
  registry.register("RetentionPolicy", RetentionPolicySchema);
  registry.register("StoragePolicy", StoragePolicySchema);

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
            schema: z.object({ schedule: z.string().min(1).nullable() }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated backup policy",
        content: {
          "application/json": {
            schema: z.object({
              data: z.object({
                id: z.string().uuid(),
                backupPolicy: z.string().nullable(),
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

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/retention-policy",
    tags,
    summary: "Get the retention policy for a database",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Retention policy details",
        content: {
          "application/json": { schema: z.object({ data: RetentionPolicySchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database or retention policy not found",
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
    path: "/databases/{id}/retention-policy",
    tags,
    summary: "Create or replace the retention policy for a database",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              type: z.enum(["count", "days", "gfs"]),
              count: z.number().int().positive().optional(),
              days: z.number().int().positive().optional(),
              gfsDaily: z.number().int().positive().optional(),
              gfsWeekly: z.number().int().positive().optional(),
              gfsMonthly: z.number().int().positive().optional(),
              gfsYearly: z.number().int().positive().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Upserted retention policy",
        content: {
          "application/json": { schema: z.object({ data: RetentionPolicySchema }) },
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

  registry.registerPath({
    method: "delete",
    path: "/databases/{id}/retention-policy",
    tags,
    summary: "Delete the retention policy for a database",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Retention policy deleted",
        content: {
          "application/json": {
            schema: z.object({ data: z.object({ databaseId: z.string().uuid() }) }),
          },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database or retention policy not found",
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
    path: "/databases/{id}/storage-policies",
    tags,
    summary: "List storage policies for a database",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "List of storage policies for the database",
        content: {
          "application/json": { schema: z.object({ data: z.array(StoragePolicySchema) }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database not found",
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
    path: "/databases/{id}/storage-policies",
    tags,
    summary: "Create a storage policy for a database",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              storageChannelId: z.string().uuid(),
              enabled: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Storage policy created",
        content: {
          "application/json": { schema: z.object({ data: StoragePolicySchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Storage policy already exists for this storage channel",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Storage channel does not belong to the database's organization",
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
    path: "/databases/{id}/storage-policies/{policyId}",
    tags,
    summary: "Enable or disable a storage policy",
    security,
    request: {
      params: z.object({ id: UuidParam, policyId: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({ enabled: z.boolean() }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated storage policy",
        content: {
          "application/json": { schema: z.object({ data: StoragePolicySchema }) },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database or storage policy not found",
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
    path: "/databases/{id}/storage-policies/{policyId}",
    tags,
    summary: "Delete a storage policy",
    security,
    request: {
      params: z.object({ id: UuidParam, policyId: UuidParam }),
    },
    responses: {
      200: {
        description: "Storage policy deleted",
        content: {
          "application/json": {
            schema: z.object({ data: z.object({ id: z.string().uuid() }) }),
          },
        },
      },
      401: {
        description: "Missing or invalid API key",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Database or storage policy not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });
}
