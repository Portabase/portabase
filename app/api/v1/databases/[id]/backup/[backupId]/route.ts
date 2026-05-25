import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleDatabaseIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/databases/[id]/backup/[backupId]" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const { id, backupId } = params ?? {};
      if (!id || !backupId) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

      const backup = await db.query.backup.findFirst({
        where: and(
          eq(drizzleDb.schemas.backup.id, backupId),
          eq(drizzleDb.schemas.backup.databaseId, id),
          isNull(drizzleDb.schemas.backup.deletedAt)
        ),
        with: {
          storages: {
            where: (bs: any, { isNull: isNullFn }: any) => isNullFn(bs.deletedAt),
          },
        },
      });

      if (!backup) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: backup });
    } catch (error) {
      log.error({ error }, "Error in GET /api/v1/databases/[id]/backup/[backupId]");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
