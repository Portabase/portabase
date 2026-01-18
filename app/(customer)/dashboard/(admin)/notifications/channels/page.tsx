import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {Metadata} from "next";
import {db} from "@/db";
import {notificationChannel, NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {desc, isNull} from "drizzle-orm";
import {ChannelsSection} from "@/components/wrappers/dashboard/admin/channels/channels-section";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";
import * as drizzleDb from "@/db";

export const metadata: Metadata = {
    title: "Notification Channels",
};

export default async function RoutePage(props: PageParams<{}>) {

    const notificationChannels = await db.query.notificationChannel.findMany({
        with: {
            organizations: true
        },
        where: isNull(drizzleDb.schemas.notificationChannel.organizationId),
        orderBy: desc(notificationChannel.createdAt)
    }) as NotificationChannelWith[]

    const organizations = await db.query.organization.findMany({
        where: (fields) => isNull(fields.deletedAt),
        with: {
            members: true,
        },
    });


    return (
        <Page>
            <PageHeader>
                <PageTitle>Notification channels</PageTitle>
                <PageActions>
                    {/*<NotifierAddEditModal adminView={false}/>*/}
                    <ChannelAddEditModal kind="notification" adminView={false}/>
                </PageActions>
            </PageHeader>
            <PageContent>
                {/*<NotificationChannelsSection organizations={organizations} notificationChannels={notificationChannels}/>*/}
                <ChannelsSection kind="notification" organizations={organizations}
                                 channels={notificationChannels}/>
            </PageContent>
        </Page>
    );
}
