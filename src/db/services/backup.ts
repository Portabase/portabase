import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { db } from "@/db";

export async function getDatabaseBackups(databaseId: string) {
  return await db.query.backup.findMany({
    where: eq(drizzleDb.schemas.backup.databaseId, databaseId),
    with: {
      restorations: true,
      storages: {
        with: {
          storageChannel: true,
        },
      },
    },
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  });
}

export async function getLatestBackups(databaseIds: string[]) {
  const { backup } = drizzleDb.schemas;
  const rows = databaseIds.length === 0 ? [] : await db
    .selectDistinctOn([backup.databaseId], {
      databaseId: backup.databaseId,
      status: backup.status,
      createdAt: backup.createdAt,
    })
    .from(backup)
    .where(and(inArray(backup.databaseId, databaseIds), isNull(backup.deletedAt)))
    .orderBy(backup.databaseId, desc(backup.createdAt));
  return new Map(rows.map(({ databaseId, ...latest }) => [databaseId, latest]));
}
