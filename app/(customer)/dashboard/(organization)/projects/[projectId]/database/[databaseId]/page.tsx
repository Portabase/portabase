import { PageParams } from "@/types/next";
import { notFound, redirect } from "next/navigation";
import { Page } from "@/features/layout/components/page";
import { db } from "@/db";
import { eq, and, inArray, isNull } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { getOrganizationProjectDatabases } from "@/db/services/project";
import { getActiveMember, getOrganization } from "@/lib/auth/auth";
import { BackupModalProvider } from "@/features/database/components/backup-modal-context";
import { DatabaseContent } from "@/features/database/components/database-content";
import { getHealthLast12hLogs } from "@/db/services/healthcheck";
import { LogsModalProvider } from "@/features/logs/components/logs-modal-context";

export default async function RoutePage(
  props: PageParams<{
    projectId: string;
    databaseId: string;
  }>,
) {
  const { projectId, databaseId } = await props.params;

  const organization = await getOrganization({});
  const activeMember = await getActiveMember();

  if (!organization || !activeMember) {
    notFound();
  }

  const databasesProject = await getOrganizationProjectDatabases({
    organizationSlug: organization.slug,
    projectId: projectId,
  });

  const dbItem = await db.query.database.findFirst({
    where: and(
      inArray(drizzleDb.schemas.backup.id, databasesProject.ids ?? []),
      eq(drizzleDb.schemas.database.id, databaseId),
      eq(drizzleDb.schemas.database.projectId, projectId),
    ),
    with: {
      project: true,
      retentionPolicy: true,
      alertPolicies: true,
      storagePolicies: true,
    },
  });

  if (!dbItem) {
    redirect("/dashboard/projects");
  }

  const totalBackups = await db
    .select({ count: drizzleDb.schemas.backup.id })
    .from(drizzleDb.schemas.backup)
    .where(eq(drizzleDb.schemas.backup.databaseId, dbItem.id))
    .then((rows) => rows.length);

  const availableBackups = await db
    .select({ count: drizzleDb.schemas.backup.id })
    .from(drizzleDb.schemas.backup)
    .where(
      and(
        eq(drizzleDb.schemas.backup.databaseId, dbItem.id),
        isNull(drizzleDb.schemas.backup.deletedAt),
      ),
    )
    .then((rows) => rows.length);

  const successfulBackups = await db
    .select({ count: drizzleDb.schemas.backup.id })
    .from(drizzleDb.schemas.backup)
    .where(
      and(
        eq(drizzleDb.schemas.backup.databaseId, dbItem.id),
        eq(drizzleDb.schemas.backup.status, "success"),
      ),
    )
    .then((rows) => rows.length);

  const isAlreadyRestore = await db
    .select({ count: drizzleDb.schemas.restoration.id })
    .from(drizzleDb.schemas.restoration)
    .where(
      and(
        eq(drizzleDb.schemas.restoration.databaseId, dbItem.id),
        eq(drizzleDb.schemas.restoration.status, "waiting"),
      ),
    )
    .then((rows) => rows.length > 0);

  const [settings] = await db
    .select()
    .from(drizzleDb.schemas.setting)
    .where(eq(drizzleDb.schemas.setting.name, "system"))
    .limit(1);
  if (!settings) {
    notFound();
  }

  const databaseHealthLogs = dbItem
    ? await getHealthLast12hLogs({ id: dbItem.id })
    : [];

  const successRate =
    totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : null;

  return (
    <Page>
      <LogsModalProvider>
        <BackupModalProvider>
          <DatabaseContent
            activeMember={activeMember}
            settings={settings}
            database={dbItem}
            databaseHealthLogs={databaseHealthLogs}
            isAlreadyRestore={isAlreadyRestore}
            totalBackups={totalBackups}
            availableBackups={availableBackups}
            successRate={successRate}
            organizationId={organization.id}
            activeOrganizationChannels={[]}
            activeOrganizationStorageChannels={[]}
          />
        </BackupModalProvider>
      </LogsModalProvider>
    </Page>
  );
}
