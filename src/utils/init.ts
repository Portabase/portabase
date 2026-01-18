import {env} from "@/env.mjs";
import {db, makeMigration} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {retentionJob} from "@/lib/tasks";
import {generateRSAKeys} from "@/utils/rsa-keys";
import {Provider} from "react";
import type {ProviderKind} from "@/features/notifications/types";
import {StorageProviderKind} from "@/features/storages/types";


export async function init() {
    consoleAscii();
    console.log("====Init Functions====");
    await generateRSAKeys();
    await makeMigration();
    await createDefaultOrganization();
    await createSettingsIfNotExist()
    console.log("====Initialization completed====");
    await setupCronJobs()
}

async function setupCronJobs() {
    console.log("==== Setting up Cron Jobs ====");
    retentionJob.start();
    console.log(`==== Cron job started ====`);
}

async function createSettingsIfNotExist() {
    const configSettings = {
        name: "system",
        smtpPassword: env.SMTP_PASSWORD ?? null,
        smtpFrom: env.SMTP_FROM ?? null,
        smtpHost: env.SMTP_HOST ?? null,
        smtpPort: env.SMTP_PORT ?? null,
        smtpUser: env.SMTP_USER ?? null,
    };

    const [existing] = await db.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);

    if (!existing) {
        console.log("====Init Setting : Create ====");
        await db.insert(drizzleDb.schemas.setting).values(configSettings);
    } else {
        console.log("====Init Setting : Update ====");
        await db.update(drizzleDb.schemas.setting).set(configSettings).where(eq(drizzleDb.schemas.setting.name, "system"));
    }

    const [existingLocalChannelStorage] = await db.select().from(drizzleDb.schemas.storageChannel).where(eq(drizzleDb.schemas.storageChannel.provider, "local")).limit(1);

    const localChannelValues = {
        provider: "local" as StorageProviderKind,
        enabled: true,
        name: "System",
        config: {}
    }

    if (!existingLocalChannelStorage) {
        console.log("====Local Storage : Create ====");
        const [localChannelCreated] = await db.insert(drizzleDb.schemas.storageChannel).values(localChannelValues).returning();

        if (localChannelCreated){
            await db.update(drizzleDb.schemas.setting).set({
                defaultStorageChannelId: localChannelCreated.id,
            }).where(eq(drizzleDb.schemas.setting.name, "system"));
        }

    } else {
        console.log("====Local Storage : Update ====");
        await db.update(drizzleDb.schemas.storageChannel).set(localChannelValues).where(eq(drizzleDb.schemas.storageChannel.provider, "local"));
    }

}

async function createDefaultOrganization() {
    const defaultOrganizationConf = {
        slug: "default",
        name: "Default Organization",
        createdAt: new Date(),
    };

    const [existing] = await db.select().from(drizzleDb.schemas.organization).where(eq(drizzleDb.schemas.organization.slug, "default")).limit(1);

    if (!existing) {
        console.log("==== Creating default Organization... ====\n");
        await db.insert(drizzleDb.schemas.organization).values(defaultOrganizationConf);
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
        "                                                          \n"
    )
}
