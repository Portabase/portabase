import { NextResponse } from "next/server";
import { withApiKey, ApiKeyContext } from "@/lib/api-v1/middleware";
import { getAccessibleDatabaseIds } from "@/lib/api-v1/acl";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "api/v1/databases/[id]/restore" });

const RestoreSchema = z.object({
  backupId: z.string().uuid("backupId must be a valid UUID"),
  backupStorageId: z.string().uuid("backupStorageId must be a valid UUID"),
});

export const POST = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
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

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
      }

      const parsed = RestoreSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 422 }
        );
      }

      const { backupId, backupStorageId } = parsed.data;

      // Validate backup belongs to this database
      const backupRecord = await db.query.backup.findFirst({
        where: and(
          eq(drizzleDb.schemas.backup.id, backupId),
          eq(drizzleDb.schemas.backup.databaseId, id),
          isNull(drizzleDb.schemas.backup.deletedAt)
        ),
        columns: { id: true },
      });

      if (!backupRecord) {
        return NextResponse.json({ error: "Backup not found for this database" }, { status: 404 });
      }

      // Validate backupStorage belongs to backup and is successful
      const backupStorage = await db.query.backupStorage.findFirst({
        where: and(
          eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
          eq(drizzleDb.schemas.backupStorage.backupId, backupId),
          isNull(drizzleDb.schemas.backupStorage.deletedAt)
        ),
      });

      if (!backupStorage) {
        return NextResponse.json({ error: "Backup storage not found" }, { status: 404 });
      }

      if (backupStorage.status !== "success") {
        return NextResponse.json(
          { error: "Backup storage is not in a successful state" },
          { status: 422 }
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
        return NextResponse.json({ error: "Failed to create restoration" }, { status: 500 });
      }

      return NextResponse.json({ data: restoration }, { status: 201 });
    } catch (error) {
      log.error({ error }, "Error in POST /api/v1/databases/[id]/restore");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
