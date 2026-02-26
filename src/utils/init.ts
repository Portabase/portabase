import { env } from "@/env.mjs";
import { db, makeMigration } from "@/db";
import { eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { cleaningJob, retentionJob } from "@/lib/tasks";
import { generateRSAKeys, getOrCreateMasterKey } from "@/utils/rsa-keys";
import { StorageProviderKind } from "@/features/storages/types";

export async function init() {
  consoleAscii();
  console.log("====Init Functions====");
  await getOrCreateMasterKey();
  await generateRSAKeys();
  await makeMigration();
  await createDefaultOrganization();
  await createSettingsIfNotExist();
  console.log("====Initialization completed====");
  await setupCronJobs();
  await setupCleaningJobs();

  if (
    (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) ||
    (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET)
  ) {
    console.warn(
      "[Deprecation Warning] You have set up OAuth credentials in your environment variables, but the format is now different. Please update your environment variables to use the new format. For example, if you were using AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, you should now use AUTH_GOOGLE_CLIENT and AUTH_GOOGLE_SECRET. Please refer to the documentation for more details.",
    );
  }
}

async function setupCronJobs() {
  console.log("==== Setting up Cron Jobs ====");
  retentionJob.start();
  console.log("==== Cron job started ====");
}

async function setupCleaningJobs() {
  console.log("==== Setting up Cleaning Jobs ====");
  cleaningJob.start();
  console.log("==== Cleaning job started ====");
}

async function createSettingsIfNotExist() {
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
        .set({ defaultStorageChannelId: localStorage.id })
        .where(eq(drizzleDb.schemas.setting.id, finalSystemSetting.id));
    }
  });
}

async function createDefaultOrganization() {
  const defaultOrganizationConf = {
    slug: "default",
    name: "Default Organization",
    createdAt: new Date(),
  };

  const [existing] = await db
    .select()
    .from(drizzleDb.schemas.organization)
    .where(eq(drizzleDb.schemas.organization.slug, "default"))
    .limit(1);

  if (!existing) {
    console.log("==== Creating default Organization... ====");
    await db
      .insert(drizzleDb.schemas.organization)
      .values(defaultOrganizationConf);
  }
}

function consoleAscii() {
  console.log(
    "                                                          \n" +
      "     ____             __        __                        \n" +
      "    / __ \\____  _____/ /_____ _/ /_  ____ _________       \n" +
      "   / /_/ / __ \\/ ___/ __/ __  / __ \\/ __  / ___/ _ \\      \n" +
      "  / ____/ /_/ / /  / /_/ /_/ / /_/ / /_/ (__  )  __/           \n" +
      " /_/    \\____/_/   \\__/\\__,_/_.___/\\__,_/____/\\___/       \n" +
      "                                                          \n" +
      ` Community Edition v${env.NEXT_PUBLIC_PROJECT_VERSION}   \n ` +
      "                                                          \n",
  );
}
