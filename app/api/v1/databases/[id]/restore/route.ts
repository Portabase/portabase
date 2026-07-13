import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";

const log = logger.child({ module: "api/v1/databases/[id]/restore" });

const RestoreSchema = z.object({
  backupId: z.string().uuid("backupId must be a valid UUID"),
  backupStorageId: z.string().uuid("backupStorageId must be a valid UUID"),
});

export const POST = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;

        const body = await parseJsonBody(req, RestoreSchema);

        if (!body.ok) {
          return body.response;
        }

        const { backupId, backupStorageId } = body.data;

        const backupRecord = await db.query.backup.findFirst({
          where: and(
              eq(drizzleDb.schemas.backup.id, backupId),
              eq(drizzleDb.schemas.backup.databaseId, id),
              isNull(drizzleDb.schemas.backup.deletedAt)
          ),
          columns: {
            id: true,
          },
        });

        if (!backupRecord) {
          return NextResponse.json(
              { error: "Backup not found for this database" },
              { status: 404 }
          );
        }

        const backupStorage = await db.query.backupStorage.findFirst({
          where: and(
              eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
              eq(drizzleDb.schemas.backupStorage.backupId, backupId),
              isNull(drizzleDb.schemas.backupStorage.deletedAt)
          ),
        });

        if (!backupStorage) {
          return NextResponse.json(
              { error: "Backup storage not found" },
              { status: 404 }
          );
        }

        if (backupStorage.status !== "success") {
          return NextResponse.json(
              { error: "Backup storage is not in a successful state" },
              { status: 422 }
          );
        }

        const existingRestorationBackup = await db.query.restoration.findFirst({
          where: and(
              eq(drizzleDb.schemas.restoration.databaseId, id),
              inArray(drizzleDb.schemas.restoration.status, ["waiting", "ongoing"])
          ),
        });

        if (existingRestorationBackup) {
          return NextResponse.json(
              {
                error:
                    "A restoration is already waiting or ongoing for this database",
              },
              { status: 409 }
          );
        }

        const [restoration] = await db
            .insert(drizzleDb.schemas.restoration)
            .values({
              databaseId: id,
              backupId,
              backupStorageId,
              status: "waiting",
            })
            .returning();

        if (!restoration) {
          return NextResponse.json(
              { error: "Failed to create restoration" },
              { status: 500 }
          );
        }

        return NextResponse.json({ data: restoration }, { status: 201 });
      } catch (error) {
        log.error({ error }, "Error in POST /api/v1/databases/[id]/restore");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);