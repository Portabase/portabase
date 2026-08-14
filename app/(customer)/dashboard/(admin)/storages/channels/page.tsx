import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {Metadata} from "next";
import {ChannelsSection} from "@/features/channel/components/channels-section";
import {db} from "@/db";
import {and, desc, eq, inArray, isNull, or} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {ChannelAddEditModal} from "@/features/channel/components/channel-add-edit-modal";
import {currentUser} from "@/lib/auth/current-user";
import {User} from "@/db/schema/02_user";
import {env} from "@/env.mjs";
import {getOrganization} from "@/lib/auth/auth";

export const metadata: Metadata = {
    title: "Storage Channels",
};

export default async function RoutePage(props: PageParams<{}>) {
    const user = (await currentUser()) as User;

    // Demo mode: this admin page transparently shows the visitor's own org
    // channels instead of the global (org-less) ones, so administration works
    // on their own scope without exposing instance-wide infrastructure.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;
    const activeOrg = isDemoUser ? await getOrganization({}) : null;

    const storageChannels = await db.query.storageChannel.findMany({
        with: {
            organizations: true
        },
        // Demo: the visitor's own org channels plus the global "local" System
        // channel, so local storage is available by default for backups.
        where: activeOrg
            ? or(
                  eq(drizzleDb.schemas.storageChannel.organizationId, activeOrg.id),
                  and(
                      isNull(drizzleDb.schemas.storageChannel.organizationId),
                      eq(drizzleDb.schemas.storageChannel.provider, "local"),
                  ),
              )
            : isNull(drizzleDb.schemas.storageChannel.organizationId),
        orderBy: desc(drizzleDb.schemas.storageChannel.createdAt)
    }) as StorageChannelWith[]

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

    const settings = await db.query.setting.findFirst({
        where: eq(drizzleDb.schemas.setting.name, "system"),
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
                <ChannelsSection defaultStorageChannelId={settings?.defaultStorageChannelId} kind={"storage"} organizations={organizations} channels={storageChannels} activeOrganization={activeOrg ?? undefined}/>
            </PageContent>
        </Page>
    );
}
