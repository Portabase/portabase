import {PageParams} from "@/types/next";
import {Page, PageActions, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {currentUser} from "@/lib/auth/current-user";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {notFound} from "next/navigation";
import {
    DeleteOrganizationButton
} from "@/components/wrappers/dashboard/organization/delete-organization/delete-organization-button";
import {EditButtonSettings} from "@/components/wrappers/dashboard/settings/edit-button-settings/edit-button-settings";
import {Metadata} from "next";
import {OrganizationTabs} from "@/components/wrappers/dashboard/organization/tabs/organization-tabs";
import {getOrganizationChannels} from "@/db/services/notification-channel";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";
import {getOrganizationStorageChannels} from "@/db/services/storage-channel";

export const metadata: Metadata = {
    title: "Settings",
};

export default async function RoutePage(props: PageParams<{ slug: string }>) {
    const organization = await getOrganization({});
    const user = await currentUser();
    const activeMember = await getActiveMember()

    if (!organization || !activeMember) {
        notFound();
    }

    const notificationChannels = await getOrganizationChannels(organization.id)
    const storageChannels = await getOrganizationStorageChannels(organization.id)
    const permissions = computeOrganizationPermissions(activeMember);


    return (
        <Page>
            <PageHeader>
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">
                        Organization settings
                    </div>
                        <div className="flex items-center gap-2 md:justify-between w-full ">
                            <div className="flex items-center gap-2">
                                {permissions.canManageSettings && organization.slug !== "default" && (
                                    <EditButtonSettings/>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {permissions.canManageDangerZone && organization.slug !== "default" && (
                                    <DeleteOrganizationButton organizationSlug={organization.slug}/>
                                )}
                            </div>
                        </div>
                </PageTitle>
            </PageHeader>
            <PageContent>
                <OrganizationTabs
                    activeMember={activeMember}
                    organization={organization}
                    notificationChannels={notificationChannels}
                    storageChannels={storageChannels}
                />
            </PageContent>
        </Page>
    )
}