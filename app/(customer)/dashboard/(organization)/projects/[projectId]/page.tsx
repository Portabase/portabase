import { PageParams } from "@/types/next";
import { Page, PageContent, PageTitle } from "@/features/layout/components/page";
import { ButtonDeleteProject } from "@/features/projects/components/project-delete-button";
import { CardsWithPagination } from "@/components/common/cards-with-pagination";
import { ProjectDatabaseCard } from "@/features/projects/components/project-database-card";
import { ProjectDatabaseSelection } from "@/features/projects/components/project-database-selection";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { getActiveMember, getOrganization } from "@/lib/auth/auth";
import * as drizzleDb from "@/db";
import { capitalizeFirstLetter, isUUID } from "@/utils/text";
import { ProjectDialog } from "@/features/projects/components/project-dialog";
import { ProjectWith } from "@/db/schema/06_project";
import { getOrganizationAvailableDatabases } from "@/db/services/database";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import { RetentionPolicySheet } from "@/features/database/components/retention-policy-sheet";
import { CronButton } from "@/features/database/components/cron-button";
import { ChannelPoliciesModal } from "@/features/database/components/channels-policy-modal";
import { Megaphone, HardDrive } from "lucide-react";

export default async function RoutePage(
  props: PageParams<{
    projectId: string;
  }>,
) {
  const { projectId } = await props.params;

  if (!isUUID(projectId)) {
    notFound();
  }

  const organization = await getOrganization({});
  const activeMember = await getActiveMember();

  if (!organization) {
    notFound();
  }
  const org = await db.query.organization.findFirst({
    where: eq(drizzleDb.schemas.organization.slug, organization.slug),
  });

  if (!org) notFound();

  const proj = await db.query.project.findFirst({
    where: (proj, { and, eq, not }) =>
      and(
        eq(proj.id, projectId),
        eq(proj.organizationId, org.id),
        not(eq(proj.isArchived, true)),
      ),
    with: {
      databases: true,
      storagePolicies: { with: { storageChannel: true } },
      alertPolicies: { with: { notificationChannel: true } },
      retentionPolicy: true,
    },
  });

  if (!proj) {
    redirect("/dashboard/projects");
  }

  const availableDatabases = await getOrganizationAvailableDatabases(
    organization.id,
    proj.id,
  );
  const isMember = activeMember?.role === "member";

  const orgNotificationChannels = (
    await getOrganizationChannels(org.id)
  ).filter((c) => c.enabled);
  const orgStorageChannels = (
    await getOrganizationStorageChannels(org.id)
  ).filter((c) => c.enabled);

  return (
    <Page>
      <div className="justify-between gap-2 sm:flex">
        <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
          <div className="min-w-full md:min-w-fit ">
            {capitalizeFirstLetter(proj.name)}
          </div>
          {!isMember && (
            <div className="flex items-center gap-2 md:justify-between w-full ">
              <div className="flex items-center gap-2">
                <ProjectDialog
                  databases={availableDatabases}
                  organization={org}
                  project={proj as unknown as ProjectWith}
                  isEdit={true}
                />
                <RetentionPolicySheet
                  scope={{ type: "project", id: proj.id }}
                  retentionPolicy={proj.retentionPolicy ?? null}
                  hasBackupPolicy={proj.backupPolicy !== null}
                  queryKey={["project-policies", proj.id]}
                />
                <CronButton
                  scope={{ type: "project", id: proj.id }}
                  currentCron={proj.backupPolicy}
                  queryKey={["project-policies", proj.id]}
                />
                <ChannelPoliciesModal
                  scope={{ type: "project", id: proj.id }}
                  alertPolicies={proj.alertPolicies ?? []}
                  kind="notification"
                  icon={<Megaphone />}
                  channels={orgNotificationChannels}
                  organizationId={org.id}
                  queryKey={["project-policies", proj.id]}
                />
                <ChannelPoliciesModal
                  scope={{ type: "project", id: proj.id }}
                  storagePolicies={proj.storagePolicies ?? []}
                  icon={<HardDrive />}
                  kind="storage"
                  channels={orgStorageChannels}
                  organizationId={org.id}
                  queryKey={["project-policies", proj.id]}
                />
              </div>
              <div className="flex items-center gap-2">
                <ButtonDeleteProject
                  projectId={projectId}
                  text={"Delete Project"}
                />
              </div>
            </div>
          )}
        </PageTitle>
      </div>
      <PageContent className="flex flex-col w-full h-full">
        {proj.databases.length > 0 ? (
          isMember ? (
            <CardsWithPagination
              data={[...proj.databases].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )}
              organizationSlug={organization.slug}
              // @ts-ignore
              cardItem={ProjectDatabaseCard}
              cardsPerPage={20}
              numberOfColumns={3}
              pageSizeOptions={[10, 20, 50]}
              extendedProps={proj}
            />
          ) : (
            <ProjectDatabaseSelection
              projectId={proj.id}
              databases={proj.databases}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
            <p className="text-lg font-medium">No databases found</p>
            <p className="text-sm mt-2">
              You haven’t added any databases to this project yet.
            </p>
          </div>
        )}
      </PageContent>
    </Page>
  );
}
