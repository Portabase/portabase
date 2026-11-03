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
import { getLatestBackups } from "@/db/services/backup";
import { maskDatabasesSecretsForClient } from "@/features/database/utils/credential-fields";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import { RetentionPolicySheet } from "@/features/database/components/retention-policy-sheet";
import { CronButton } from "@/features/database/components/cron-button";
import { ChannelPoliciesModal } from "@/features/database/components/channels-policy-modal";
import { Megaphone, HardDrive } from "lucide-react";
import { InfoTooltip } from "@/features/stats/components/info-tooltip";
import { getLiveness } from "@/features/agents/utils/status/agent-status";
import { getDbmsFilter, lastBackupFilter, livenessFilter } from "@/components/common/filters/presets";

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
  const organizationRecord = await db.query.organization.findFirst({
    where: eq(drizzleDb.schemas.organization.slug, organization.slug),
  });

  if (!organizationRecord) notFound();

  const project = await db.query.project.findFirst({
    where: (project, { and, eq, not }) =>
      and(
        eq(project.id, projectId),
        eq(project.organizationId, organizationRecord.id),
        not(eq(project.isArchived, true)),
      ),
    with: {
      databases: true,
      storagePolicies: true,
      alertPolicies: true,
      retentionPolicy: true,
    },
  });

  if (!project) {
    redirect("/dashboard/projects");
  }

  project.databases = maskDatabasesSecretsForClient(project.databases);
  const latestBackups = await getLatestBackups(project.databases.map((database) => database.id));
  const databases = project.databases.map((database) => {
    const lastBackup = latestBackups.get(database.id) ?? null;
    return {
      ...database,
      lastBackup,
      lastBackupStatus: lastBackup?.status ?? "none",
      liveness: getLiveness(database.lastContact),
    };
  });
  const filtersConfig = [lastBackupFilter, livenessFilter, getDbmsFilter(databases)];

  const availableDatabases = maskDatabasesSecretsForClient(
    await getOrganizationAvailableDatabases(organization.id, project.id),
  );
  const isMember = activeMember?.role === "member";

  const organizationNotificationChannels = (
    await getOrganizationChannels(organizationRecord.id)
  ).filter((channel) => channel.enabled);
  const organizationStorageChannels = (
    await getOrganizationStorageChannels(organizationRecord.id)
  ).filter((channel) => channel.enabled);

  return (
    <Page>
      <div className="justify-between gap-2 sm:flex">
        <PageTitle className="flex flex-col md:flex-row items-center justify-between w-full ">
          <div className="min-w-full md:min-w-fit ">
            {capitalizeFirstLetter(project.name)}
          </div>
          {!isMember && (
            <div className="flex items-center gap-2 md:justify-between w-full ">
              <div className="flex items-center gap-2">
                <ProjectDialog
                  databases={availableDatabases}
                  organization={organizationRecord}
                  project={project as unknown as ProjectWith}
                  isEdit={true}
                />
                <RetentionPolicySheet
                  scope={{ type: "project", id: project.id }}
                  retentionPolicy={project.retentionPolicy ?? null}
                  hasBackupPolicy={project.backupPolicy !== null}
                  queryKey={["project-policies", project.id]}
                />
                <CronButton
                  scope={{ type: "project", id: project.id }}
                  currentCron={project.backupPolicy}
                  queryKey={["project-policies", project.id]}
                />
                <ChannelPoliciesModal
                  scope={{ type: "project", id: project.id }}
                  alertPolicies={project.alertPolicies ?? []}
                  kind="notification"
                  icon={<Megaphone />}
                  channels={organizationNotificationChannels}
                  organizationId={organizationRecord.id}
                  queryKey={["project-policies", project.id]}
                />
                <ChannelPoliciesModal
                  scope={{ type: "project", id: project.id }}
                  storagePolicies={project.storagePolicies ?? []}
                  icon={<HardDrive />}
                  kind="storage"
                  channels={organizationStorageChannels}
                  organizationId={organizationRecord.id}
                  queryKey={["project-policies", project.id]}
                />
                <InfoTooltip
                  content={
                    "Default policies for every database in this project. Each database inherits these unless you override a policy on its own page."
                  }
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
        {databases.length > 0 ? (
          isMember ? (
            <CardsWithPagination
              data={[...databases].sort(
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
              extendedProps={project}
              filtersConfig={filtersConfig}
              searchKeys={["name"]}
              searchPlaceholder="Search by name"
            />
          ) : (
            <ProjectDatabaseSelection
              projectId={project.id}
              databases={databases}
              filtersConfig={filtersConfig}
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
