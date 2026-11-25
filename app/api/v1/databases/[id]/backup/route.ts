import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import {and, desc, eq, inArray, isNull} from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";

const log = logger.child({ module: "api/v1/databases/[id]/backup" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;

        const backups = await db.query.backup.findMany({
          where: and(
              eq(drizzleDb.schemas.backup.databaseId, id),
              isNull(drizzleDb.schemas.backup.deletedAt)
          ),
          orderBy: [desc(drizzleDb.schemas.backup.createdAt)],
        });

        return NextResponse.json({ data: backups });
      } catch (error) {
        log.error({ error }, "Error in GET /api/v1/databases/[id]/backup");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);

const TriggerBackupSchema = z.object({
  full: z.boolean().optional(),
});

export const POST = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const body = await parseJsonBody(req, TriggerBackupSchema, { optional: true });
        if (!body.ok) return body.response;
        const fullRequested = body.data.full ?? false;

        const { id } = guard.data;

        const database = await db.query.database.findFirst({
          where: eq(drizzleDb.schemas.database.id, id),
          columns: { methodConflict: true, backupEngine: true },
        });
        if (fullRequested && database?.backupEngine !== "physical") {
          return NextResponse.json(
              { error: "A full backup can only be requested for a source using the physical method" },
              { status: 422 }
          );
        }
        if (database?.methodConflict) {
          return NextResponse.json(
              { error: "Backups are suspended: databases.json announces a different backup method for this source." },
              { status: 409 }
          );
        }

        const existingBackup = await db.query.backup.findFirst({
          where: and(
              eq(drizzleDb.schemas.backup.databaseId, id),
              inArray(drizzleDb.schemas.backup.status, ["waiting", "ongoing"])
          ),
        });

        if (existingBackup) {
          return NextResponse.json(
              {
                error:
                    "A backup is already waiting or ongoing for this database",
              },
              { status: 409 }
          );
        }

        const [createdBackup] = await db
            .insert(drizzleDb.schemas.backup)
            .values({
              databaseId: id,
              status: "waiting",
              fullRequested,
            })
            .returning();

        if (!createdBackup) {
          return NextResponse.json(
              { error: "Failed to create backup" },
              { status: 500 }
          );
        }

        return NextResponse.json({ data: createdBackup }, { status: 201 });
      } catch (error) {
        log.error({ error }, "Error in POST /api/v1/databases/[id]/backup");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);