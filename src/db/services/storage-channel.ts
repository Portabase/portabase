"use server";

import { desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  organizationStorageChannel,
  StorageChannel,
  storageChannel,
} from "@/db/schema/12_storage-channel";

export async function getOrganizationStorageChannels(
  organizationId: string,
): Promise<StorageChannel[]> {
  const [orgChannels, systemChannels] = await Promise.all([
    db
      .select({
        id: storageChannel.id,
        name: storageChannel.name,
        provider: storageChannel.provider,
        organizationId: storageChannel.organizationId,
        config: storageChannel.config,
        enabled: storageChannel.enabled,
        updatedAt: storageChannel.updatedAt,
        createdAt: storageChannel.createdAt,
        deletedAt: storageChannel.deletedAt,
      })
      .from(organizationStorageChannel)
      .innerJoin(
        storageChannel,
        eq(organizationStorageChannel.storageChannelId, storageChannel.id),
      )
      .orderBy(desc(storageChannel.createdAt))
      .where(eq(organizationStorageChannel.organizationId, organizationId)),
    db
      .select({
        id: storageChannel.id,
        name: storageChannel.name,
        provider: storageChannel.provider,
        organizationId: storageChannel.organizationId,
        config: storageChannel.config,
        enabled: storageChannel.enabled,
        updatedAt: storageChannel.updatedAt,
        createdAt: storageChannel.createdAt,
        deletedAt: storageChannel.deletedAt,
      })
      .from(storageChannel)
      .orderBy(desc(storageChannel.createdAt))
      .where(isNull(storageChannel.organizationId)),
  ]);

  const seen = new Set<string>();
  return [...orgChannels, ...systemChannels].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  }) as StorageChannel[];
}
