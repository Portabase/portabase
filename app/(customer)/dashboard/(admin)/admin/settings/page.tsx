import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {db} from "@/db";
import {logger} from "@/lib/logger";
import {notFound} from "next/navigation";
import {SettingsTabs} from "@/features/settings/components/settings-tabs";
import {desc, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";

const log = logger.child({module: "dashboard/admin/settings"});

export default async function RoutePage(props: PageParams<{}>) {

    const settings = await db.query.setting.findFirst({
        where: (fields, {eq}) => eq(fields.name, "system"),
    });

    log.debug({settings}, "Settings loaded");

    const storageChannels = await db.query.storageChannel.findMany({
        with: {
            organizations: true
        },
        where: isNull(drizzleDb.schemas.storageChannel.organizationId),
        orderBy: desc(drizzleDb.schemas.storageChannel.createdAt)
    }) as StorageChannelWith[]

    const notificationChannels = await db.query.notificationChannel.findMany({
        with: {
            organizations: true
        },
        where: isNull(drizzleDb.schemas.notificationChannel.organizationId),
        orderBy: desc(drizzleDb.schemas.notificationChannel.createdAt)
    }) as NotificationChannelWith[]


    if (!settings || !storageChannels || !notificationChannels) {
        notFound()
    }

    return (
        <Page>
            <PageHeader className="flex flex-col">
                <div className="flex justify-between">
                    <PageTitle className="mb-3">System settings</PageTitle>
                </div>
            </PageHeader>
            <PageContent className="flex flex-col gap-5">
                <SettingsTabs storageChannels={storageChannels} notificationChannels={notificationChannels}
                              settings={settings}/>
            </PageContent>
        </Page>
    );
}
