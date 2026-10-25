import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  organizationStorageChannel,
  StorageChannel,
  storageChannel,
} from "@/db/schema/12_storage-channel";

export async function getOrganizationStorageChannels(
  organizationId: string,
): Promise<StorageChannel[]> {
  const channels = await db
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
    .where(eq(organizationStorageChannel.organizationId, organizationId));

  return channels.map((c) =>
    c.organizationId === organizationId ? c : { ...c, config: null },
  ) as StorageChannel[];
}
