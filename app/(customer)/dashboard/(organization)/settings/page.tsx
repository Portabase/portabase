import {PageParams} from "@/types/next";
import {
    Page,
    PageContent,
    PageHeader,
    PageTitle,
} from "@/features/layout/components/page";
import {currentUser} from "@/lib/auth/current-user";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {notFound} from "next/navigation";
import {Metadata} from "next";
import {OrganizationTabs} from "@/features/organizations/components/organization-tabs";
import {getOrganizationChannels} from "@/db/services/notification-channel";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";
import {getOrganizationStorageChannels} from "@/db/services/storage-channel";
import {DeleteOrganizationButton} from "@/features/organizations/components/organization-delete-button";
import {EditOrganizationDialog} from "@/features/organizations/components/organization-edit-dialog";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, isNull} from "drizzle-orm";
import {env} from "@/env.mjs";
import {getOrganizationAgents} from "@/db/services/agent";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

export const metadata: Metadata = {
    title: "Settings",
};

export default async function RoutePage(props: PageParams<{ slug: string }>) {
    const organization = await getOrganization({});
    const user = await currentUser();
    const activeMember = await getActiveMember();

    if (!organization || !activeMember || !user) {
        notFound();
    }

    // Demo mode: the visitor only ever sees their own account and their own
    // channels, never other orgs' or the instance-wide (global) ones. The
    // shared services merge in global "system" channels, so filter them out
    // here -- keeping only the local storage channel, needed for backups.
    const isDemoUser = env.DEMO_ENABLED && user.isAnonymous === true;

    const allNotificationChannels = await getOrganizationChannels(organization.id);
    const allStorageChannels = await getOrganizationStorageChannels(organization.id);
    const notificationChannels = isDemoUser
        ? allNotificationChannels.filter((c) => c.organizationId === organization.id)
        : allNotificationChannels;
    const storageChannels = isDemoUser
        ? allStorageChannels.filter(
              (c) => c.organizationId === organization.id || c.provider === "local",
          )
        : allStorageChannels;

    const agents = await getOrganizationAgents(organization.id);
    const permissions = computeOrganizationPermissions(activeMember);

    const users = await db.query.user.findMany({
        where: (fields) =>
            isDemoUser
                ? and(isNull(fields.deletedAt), eq(fields.id, user.id))
                : isNull(fields.deletedAt),
    });

    const organizationWithMembers = await db.query.organization.findFirst({
        where: eq(drizzleDb.schemas.organization.id, organization.id),
        with: {
            projects: {
                where: eq(drizzleDb.schemas.project.isArchived, false),
            },
            members: {
                with: {
                    user: true,
                },
            },
        },
    });

    if (!organizationWithMembers) notFound();

    return (
        <Page>
            <PageHeader>
                <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
                    <div className="min-w-full md:min-w-fit ">Organization settings</div>
                    <div className="flex items-center gap-2 md:justify-between w-full ">
                        <div className="flex items-center gap-2">
                            {permissions.canManageSettings &&
                                organization.slug !== "default" && (
                                    <EditOrganizationDialog
                                        organization={organizationWithMembers}
                                        users={users}
                                        currentUser={user}
                                    />
                                )}
                        </div>
                        <div className="flex items-center gap-2">
                            {permissions.canManageDangerZone &&
                                organization.slug !== "default" && (

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <DeleteOrganizationButton
                                                    disabled={organizationWithMembers.projects.length > 0}
                                                    organizationSlug={organization.slug}
                                                />
                                            </div>

                                        </TooltipTrigger>
                                        {organizationWithMembers.projects.length > 0 && (
                                            <TooltipContent>
                                                <p>Your organization has some projects associated with it. Please delete them before deleting the organization.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>

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
                    agents={agents}
                />
            </PageContent>
        </Page>
    );
}
