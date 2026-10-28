import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {isUuid} from "@/lib/api-v1/validation/uuid";
import {deleteBackupService} from "@/lib/tasks/database/utils/backup-delete.service";

const log = logger.child({
  module: "api/v1/databases/[id]/backup/[backupId]",
});

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;
        const backupId = params?.backupId;

        if (!isUuid(backupId)) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const backup = await db.query.backup.findFirst({
          where: and(
              eq(drizzleDb.schemas.backup.id, backupId),
              eq(drizzleDb.schemas.backup.databaseId, id),
              isNull(drizzleDb.schemas.backup.deletedAt)
          ),
          with: {
            storages: {
              where: (backupStorage, { isNull }) =>
                  isNull(backupStorage.deletedAt),
            },
          },
        });

        if (!backup) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ data: backup });
      } catch (error) {
        log.error(
            { error },
            "Error in GET /api/v1/databases/[id]/backup/[backupId]"
        );

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);

export const DELETE = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);
        if (!guard.ok) return guard.response;

        const backupId = params?.backupId;
        const backup = isUuid(backupId)
            ? await db.query.backup.findFirst({
              where: and(
                  eq(drizzleDb.schemas.backup.id, backupId),
                  eq(drizzleDb.schemas.backup.databaseId, guard.data.id),
                  isNull(drizzleDb.schemas.backup.deletedAt)
              ),
              columns: { id: true },
            })
            : undefined;
        if (!backup) {
          return NextResponse.json({ error: "Backup not found." }, { status: 404 });
        }

        const result = await deleteBackupService(backup.id, guard.data.id);
        if (!result.ok) {
          const status = result.error === "Backup not found." ? 404 : 409;
          return NextResponse.json({ error: result.error ?? "Failed to delete backup." }, { status });
        }

        return new Response(null, { status: 204 });
      } catch (error) {
        log.error({ error }, "Error in DELETE /api/v1/databases/[id]/backup/[backupId]");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }
);
