import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {db} from "@/db";
import {notFound} from "next/navigation";
import {SettingsTabs} from "@/components/wrappers/dashboard/admin/settings/settings-tabs";
import {desc, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";

export default async function RoutePage(props: PageParams<{}>) {

    const settings = await db.query.setting.findFirst({
        where: (fields, {eq}) => eq(fields.name, "system"),
    });

    const storageChannels = await db.query.storageChannel.findMany({
        with: {
            organizations: true
        },
        where: isNull(drizzleDb.schemas.storageChannel.organizationId),
        orderBy: desc(drizzleDb.schemas.storageChannel.createdAt)
    }) as StorageChannelWith[]

    if (!settings || !storageChannels ) {
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
                <SettingsTabs storageChannels={storageChannels} settings={settings} />
            </PageContent>
        </Page>
    );
}
