import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {Metadata} from "next";
import {db} from "@/db";
import {notificationChannel, NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {and, desc, eq, inArray, isNull} from "drizzle-orm";
import {ChannelsSection} from "@/features/channel/components/channels-section";
import {ChannelAddEditModal} from "@/features/channel/components/channel-add-edit-modal";
import * as drizzleDb from "@/db";
import {currentUser} from "@/lib/auth/current-user";
import {User} from "@/db/schema/02_user";
import {env} from "@/env.mjs";
import {getOrganization} from "@/lib/auth/auth";

export const metadata: Metadata = {
    title: "Notification Channels",
};

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    // Demo mode: this admin page transparently shows the visitor's own org
    // channels instead of the global (org-less) ones, so administration works
    // on their own scope without exposing instance-wide infrastructure.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;
    const activeOrg = isDemoUser ? await getOrganization({}) : null;

    const notificationChannels = await db.query.notificationChannel.findMany({
        with: {
            organizations: true
        },
        where: activeOrg
            ? eq(drizzleDb.schemas.notificationChannel.organizationId, activeOrg.id)
            : isNull(drizzleDb.schemas.notificationChannel.organizationId),
        orderBy: desc(notificationChannel.createdAt)
    }) as NotificationChannelWith[]

    const organizations = await db.query.organization.findMany({
        where: (fields) =>
            isDemoUser
                ? and(
                      isNull(fields.deletedAt),
                      inArray(
                          fields.id,
                          db
                              .select({ id: drizzleDb.schemas.member.organizationId })
                              .from(drizzleDb.schemas.member)
                              .where(eq(drizzleDb.schemas.member.userId, user.id)),
                      ),
                  )
                : isNull(fields.deletedAt),
        with: {
            members: true,
        },
    });


    return (
        <Page>
            <PageHeader>
                <PageTitle>Notification channels</PageTitle>
                <PageActions>
                    <ChannelAddEditModal kind="notification" adminView={false}/>
                </PageActions>
            </PageHeader>
            <PageContent>
                <ChannelsSection kind="notification" organizations={organizations}
                                 channels={notificationChannels}
                                 activeOrganization={activeOrg ?? undefined}/>
            </PageContent>
        </Page>
    );
}
