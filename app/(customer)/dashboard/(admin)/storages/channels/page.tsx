import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {Metadata} from "next";
import {NotifierAddEditModal} from "@/components/wrappers/dashboard/common/notifier/notifier-add-edit-modal";
import {ChannelsSection} from "@/components/wrappers/dashboard/admin/channels/channels-section";
import {db} from "@/db";
import {desc, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";

export const metadata: Metadata = {
    title: "Storage Channels",
};

export default async function RoutePage(props: PageParams<{}>) {

    const storageChannels = await db.query.storageChannel.findMany({
        with: {
            organizations: true
        },
        orderBy: desc(drizzleDb.schemas.storageChannel.createdAt)
    }) as StorageChannelWith[]

    const organizations = await db.query.organization.findMany({
        where: (fields) => isNull(fields.deletedAt),
        with: {
            members: true,
        },
    });


    return (
        <Page>
            <PageHeader>
                <PageTitle>Storage channels</PageTitle>
                <PageActions>
                    <ChannelAddEditModal kind={"storage"} adminView={false}/>
                </PageActions>
            </PageHeader>
            <PageContent>
                <ChannelsSection kind={"storage"} organizations={organizations} channels={storageChannels}/>
            </PageContent>
        </Page>
    );
}
