import { db } from "@/db";
import { env } from "@/env.mjs";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { StorageProviderKind } from "@/features/storages/types";
import { withUpdatedAt } from "@/db/utils";

export async function createSettingsIfNotExist() {
  await db.transaction(async (tx) => {
    const systemSettingsValues = {
      name: "system",
      smtpPassword: env.SMTP_PASSWORD ?? null,
      smtpFrom: env.SMTP_FROM ?? null,
      smtpHost: env.SMTP_HOST ?? null,
      smtpPort: env.SMTP_PORT ?? null,
      smtpUser: env.SMTP_USER ?? null,
      smtpSecure: env.SMTP_SECURE ?? false,
    };

    const [systemSetting] = await tx
      .select()
      .from(drizzleDb.schemas.setting)
      .where(eq(drizzleDb.schemas.setting.name, "system"))
      .limit(1);

    const [finalSystemSetting] = systemSetting
      ? await tx
          .update(drizzleDb.schemas.setting)
          .set(systemSettingsValues)
          .where(eq(drizzleDb.schemas.setting.name, "system"))
          .returning()
      : await tx
          .insert(drizzleDb.schemas.setting)
          .values(systemSettingsValues)
          .returning();

    const localStorageValues = {
      provider: "local" as StorageProviderKind,
      enabled: true,
      name: "System",
      config: {},
    };

    const [existingLocalStorage] = await tx
      .select()
      .from(drizzleDb.schemas.storageChannel)
      .where(eq(drizzleDb.schemas.storageChannel.provider, "local"))
      .limit(1);

    const [localStorage] = existingLocalStorage
      ? await tx
          .update(drizzleDb.schemas.storageChannel)
          .set(localStorageValues)
          .where(eq(drizzleDb.schemas.storageChannel.provider, "local"))
          .returning()
      : await tx
          .insert(drizzleDb.schemas.storageChannel)
          .values(localStorageValues)
          .returning();

    if (!finalSystemSetting.defaultStorageChannelId) {
      await tx
        .update(drizzleDb.schemas.setting)
        .set(withUpdatedAt({ defaultStorageChannelId: localStorage.id }))
        .where(eq(drizzleDb.schemas.setting.id, finalSystemSetting.id));
    }
  });
}
