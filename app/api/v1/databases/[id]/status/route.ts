import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";

const log = logger.child({ module: "api/v1/databases/[id]/status" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;

        const [database, latestBackup, latestRestoration] = await Promise.all([
          db.query.database.findFirst({
            where: and(
                eq(drizzleDb.schemas.database.id, id),
                isNull(drizzleDb.schemas.database.deletedAt)
            ),
          }),

          db.query.backup.findFirst({
            where: and(
                eq(drizzleDb.schemas.backup.databaseId, id),
                isNull(drizzleDb.schemas.backup.deletedAt)
            ),
            orderBy: [desc(drizzleDb.schemas.backup.createdAt)],
          }),

          db.query.restoration.findFirst({
            where: and(
                eq(drizzleDb.schemas.restoration.databaseId, id),
                isNull(drizzleDb.schemas.restoration.deletedAt)
            ),
            orderBy: [desc(drizzleDb.schemas.restoration.createdAt)],
          }),
        ]);

        if (!database) {
          return NextResponse.json(
              { error: "Database not found" },
              { status: 404 }
          );
        }

        return NextResponse.json({
          data: {
            isWaitingForBackup: database.isWaitingForBackup,
            lastContact: database.lastContact,
            latestBackup: latestBackup ?? null,
            latestRestoration: latestRestoration ?? null,
          },
        });
      } catch (error) {
        log.error({ error }, "Error in GET /api/v1/databases/[id]/status");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);