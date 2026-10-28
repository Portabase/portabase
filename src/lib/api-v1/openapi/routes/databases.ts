import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "@/lib/api-v1/openapi/registry";
import { databaseSchema, backupSchema, restorationSchema } from "@/db/schema/07_database";
import { backupStorageSchema } from "@/db/schema/14_storage-backup";
import { dataResponse, errorResponses, RetentionPolicySchema } from "@/lib/api-v1/openapi/responses";
import { jobLogSchema } from "@/db/schema/17_job-log";

const datetimeNullable = z.string().datetime().nullable();
const datetime = z.string().datetime();
const commonTimestamps = {
  createdAt: datetime,
  updatedAt: datetimeNullable,
  deletedAt: datetimeNullable,
};

const DatabaseSchema = z
  .object({
    ...databaseSchema.omit({ config: true }).shape,
    lastContact: datetimeNullable,
    ...commonTimestamps,
  })
  .openapi("Database");

const BackupStorageSchema = z
  .object({
    ...backupStorageSchema.shape,
    ...commonTimestamps,
  })
  .openapi("BackupStorage");

const BackupSchema = z
  .object({
    ...backupSchema.shape,
    ...commonTimestamps,
  })
  .openapi("Backup");

const BackupWithStoragesSchema = BackupSchema.extend({
  storages: z.array(BackupStorageSchema),
}).openapi("BackupWithStorages");

const RestorationSchema = z
  .object({
    ...restorationSchema.shape,
    ...commonTimestamps,
  })
  .openapi("Restoration");

const JobLogSchema = z
  .object({
    ...jobLogSchema.shape,
    loggedAt: datetime,
    ...commonTimestamps,
  })
  .openapi("JobLog");

const UuidParam = z
  .string()
  .uuid()
  .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Databases"];

const ErrorSchema = z.object({ error: z.string() });

export function registerDatabaseRoutes(registry: OpenAPIRegistry) {
  registry.register("Database", DatabaseSchema);
  registry.register("Backup", BackupSchema);
  registry.register("BackupStorage", BackupStorageSchema);
  registry.register("BackupWithStorages", BackupWithStoragesSchema);
  registry.register("Restoration", RestorationSchema);
  registry.register("JobLog", JobLogSchema);

  registry.registerPath({
    method: "get",
    path: "/databases",
    tags,
    summary: "List databases",
    security,
    responses: {
      200: {
        description: "List of accessible databases",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(DatabaseSchema) }),
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
    method: "get",
    path: "/databases/{id}",
    tags,
    summary: "Get database by ID",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Database details",
        content: {
          "application/json": {
            schema: z.object({
              data: DatabaseSchema.extend({ retentionPolicy: RetentionPolicySchema.nullable() }),
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
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/status",
    tags,
    summary: "Get database status",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "Database status with latest backup and restoration",
        content: {
          "application/json": {
            schema: z.object({
              data: z.object({
                isWaitingForBackup: z.boolean().nullable(),
                lastContact: datetimeNullable,
                latestBackup: BackupSchema.nullable(),
                latestRestoration: RestorationSchema.nullable(),
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
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/backup",
    tags,
    summary: "List backups for a database",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: {
        description: "List of backups ordered by creation date descending",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(BackupSchema) }),
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
      500: {
        description: "Internal server error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/databases/{id}/backup",
    tags,
    summary: "Trigger a backup for a database",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      201: {
        description: "Backup job created with status 'waiting'",
        content: {
          "application/json": { schema: z.object({ data: BackupSchema }) },
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
      409: {
        description: "A backup is already waiting or ongoing for this database",
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
    path: "/databases/{id}/backup/{backupId}",
    tags,
    summary: "Get a specific backup with storage details",
    security,
    request: {
      params: z.object({ id: UuidParam, backupId: UuidParam }),
    },
    responses: {
      200: {
        description: "Backup with associated storage records",
        content: {
          "application/json": {
            schema: z.object({ data: BackupWithStoragesSchema }),
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
        description: "Database or backup not found",
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
    path: "/databases/{id}/restore",
    tags,
    summary: "Restore a database from a backup",
    security,
    request: {
      params: z.object({ id: UuidParam }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: z.object({
              backupId: z.uuid(),
              backupStorageId: z.uuid(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Restoration job created with status 'waiting'",
        content: {
          "application/json": {
            schema: z.object({ data: RestorationSchema }),
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
        description: "Database, backup, or backup storage not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description:
          "A restoration is already waiting or ongoing for this database, or the backup file is missing",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description:
          "Invalid request body, or backup storage is not in 'success' state",
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
    path: "/databases/{id}/restore",
    tags,
    summary: "List the restorations of a database, most recent first",
    security,
    request: { params: z.object({ id: UuidParam }) },
    responses: {
      200: dataResponse("List of restorations", z.array(RestorationSchema)),
      ...errorResponses({ 403: "Forbidden", 404: "Database not found" }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/backup/{backupId}/logs",
    tags,
    summary: "Get the job logs of a backup, oldest first",
    security,
    request: { params: z.object({ id: UuidParam, backupId: UuidParam }) },
    responses: {
      200: dataResponse("Job logs", z.array(JobLogSchema)),
      ...errorResponses({ 403: "Forbidden", 404: "Database or backup not found" }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/restore/{restorationId}/logs",
    tags,
    summary: "Get the job logs of a restoration, oldest first",
    security,
    request: { params: z.object({ id: UuidParam, restorationId: UuidParam }) },
    responses: {
      200: dataResponse("Job logs", z.array(JobLogSchema)),
      ...errorResponses({ 403: "Forbidden", 404: "Database or restoration not found" }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/databases/{id}/backup/{backupId}",
    tags,
    summary: "Permanently delete a backup and every stored copy of it",
    security,
    request: { params: z.object({ id: UuidParam, backupId: UuidParam }) },
    responses: {
      204: { description: "Backup deleted" },
      ...errorResponses({
        403: "Forbidden",
        404: "Database or backup not found",
        409: "A stored copy could not be removed; the backup is kept",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/databases/{id}/backup/{backupId}/download",
    tags,
    summary: "Get a short-lived signed URL to download one stored copy of a backup",
    description: "The URL expires after about one minute. Snapshots and replicas cannot be downloaded.",
    security,
    request: {
      params: z.object({ id: UuidParam, backupId: UuidParam }),
      query: z.object({ backupStorageId: UuidParam }),
    },
    responses: {
      200: dataResponse("Signed download URL", z.object({ url: z.string() })),
      ...errorResponses({
        403: "Forbidden",
        404: "Database, backup or backup storage not found",
        409: "The stored copy is missing, not successful, a snapshot or a replica",
        422: "backupStorageId is missing or invalid",
      }),
    },
  });
}
