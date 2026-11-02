import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import {and, desc, eq, isNull} from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {checkRestorableBackup, hasActiveRestoration} from "@/lib/api-v1/services/restorations";

const log = logger.child({ module: "api/v1/databases/[id]/restore" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);
        if (!guard.ok) return guard.response;

        const restorations = await db.query.restoration.findMany({
          where: and(
              eq(drizzleDb.schemas.restoration.databaseId, guard.data.id),
              isNull(drizzleDb.schemas.restoration.deletedAt)
          ),
          orderBy: [desc(drizzleDb.schemas.restoration.createdAt)],
        });

        return NextResponse.json({ data: restorations });
      } catch (error) {
        log.error({ error }, "Error in GET /api/v1/databases/[id]/restore");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }
);

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

        const restorable = await checkRestorableBackup(id, backupId, backupStorageId);
        if (!restorable.ok) return restorable.response;

        if (await hasActiveRestoration(id)) {
          return NextResponse.json(
              { error: "A restoration is already waiting or ongoing for this database" },
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