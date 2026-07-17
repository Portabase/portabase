"use server";

import { db } from "@/db";
import { mvKpiStorageTreemap } from "@/db/schema/16_dashboard-views";
import { backup } from "@/db/schema/07_database";
import { backupStorage } from "@/db/schema/14_storage-backup";
import { storageChannel } from "@/db/schema/12_storage-channel";
import { and, count, desc, eq, inArray, isNotNull, sum } from "drizzle-orm";
import {
  type DashboardScope,
  isEmptyScope,
  scopedDatabaseIds,
} from "@/features/stats/queries/scope.queries";

export type StorageTreemapRow = {
  channelId: string;
  channelName: string;
  provider: string;
  totalBytes: number;
  backupCount: number;
};

export async function getStorageTreemap(
  scope: DashboardScope,
): Promise<StorageTreemapRow[]> {
  if (isEmptyScope(scope)) return [];

  if (!scope) {
    const rows = await db
      .select()
      .from(mvKpiStorageTreemap)
      .orderBy(desc(mvKpiStorageTreemap.totalBytes));
    return rows.map((r) => ({
      channelId: r.channelId ?? "unknown",
      channelName: r.channelName ?? "unknown",
      provider: r.provider ?? "unknown",
      totalBytes: Number(r.totalBytes ?? 0),
      backupCount: Number(r.backupCount ?? 0),
    }));
  }

  const totalBytes = sum(backupStorage.size);

  const rows = await db
    .select({
      channelId: storageChannel.id,
      channelName: storageChannel.name,
      provider: storageChannel.provider,
      totalBytes,
      backupCount: count(backupStorage.id),
    })
    .from(backupStorage)
    .innerJoin(
      storageChannel,
      eq(storageChannel.id, backupStorage.storageChannelId),
    )
    .innerJoin(backup, eq(backup.id, backupStorage.backupId))
    .where(
      and(
        eq(backupStorage.status, "success"),
        isNotNull(backupStorage.size),
        inArray(backup.databaseId, scopedDatabaseIds(scope)),
      ),
    )
    .groupBy(storageChannel.id, storageChannel.name, storageChannel.provider)
    .orderBy(desc(totalBytes));

  return rows.map((r) => ({
    channelId: r.channelId,
    channelName: r.channelName,
    provider: r.provider ?? "unknown",
    totalBytes: Number(r.totalBytes ?? 0),
    backupCount: r.backupCount,
  }));
}
