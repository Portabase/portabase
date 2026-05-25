import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleDatabaseIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/databases/[id]/status" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const accessibleIds = await getAccessibleDatabaseIds(ctx.userId);
      if (!accessibleIds.includes(id)) {
        const exists = await db.query.database.findFirst({
          where: eq(drizzleDb.schemas.database.id, id),
          columns: { id: true },
        });
        return NextResponse.json(
          { error: exists ? "Forbidden" : "Not found" },
          { status: exists ? 403 : 404 }
        );
      }

      const [latestBackup, latestRestoration] = await Promise.all([
        db.query.backup.findFirst({
          where: and(
            eq(drizzleDb.schemas.backup.databaseId, id),
            isNull(drizzleDb.schemas.backup.deletedAt)
          ),
          orderBy: [desc(drizzleDb.schemas.backup.createdAt)],
        }),
        db.query.restoration.findFirst({
          where: eq(drizzleDb.schemas.restoration.databaseId, id),
          orderBy: [desc(drizzleDb.schemas.restoration.createdAt)],
        }),
      ]);

      return NextResponse.json({
        data: {
          latestBackup: latestBackup ?? null,
          latestRestoration: latestRestoration ?? null,
        },
      });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/databases/[id]/status");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
