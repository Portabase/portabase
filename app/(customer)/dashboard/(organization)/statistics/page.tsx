import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatsLayout } from "@/features/stats/layouts/stats-layout";
import {
  getCriticalAlerts24h,
  getTotalNotifications24h,
} from "@/features/stats/queries/alerts.queries";
import {
  getDatabasesAvailability,
  getAgentsAvailability,
} from "@/features/stats/queries/availability.queries";
import {
  getBackupCounts,
  getBackupEvolution,
} from "@/features/stats/queries/backup.queries";
import { getStorageTreemap } from "@/features/stats/queries/storage.queries";
import { getDbmsTreemap } from "@/features/stats/queries/dbms.queries";
import { getAgentsWithRecentHealthchecks } from "@/features/stats/queries/agents-status.queries";
import {
  getProjectsCount,
  getRestorationsCount,
} from "@/features/stats/queries/project.queries";
import { getNotificationHistory } from "@/db/services/notification-log";
import {
  getAgentLinkAccess,
  type DashboardScope,
} from "@/features/stats/queries/scope.queries";
import { getOrganization } from "@/lib/auth/auth";
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/features/layout/components/page";
import { refreshDashboardViews } from "@/features/stats/queries/views.queries";

export const metadata: Metadata = { title: "Statistics" };

export default async function RoutePage() {
  const organization = await getOrganization({});
  if (!organization) notFound();

  const scope: DashboardScope = [organization.id];

  const [
    { total: alerts24h },
    { total: totalNotifications24h },
    dbStats,
    agentStats,
    backupCounts,
    evolution,
    storageTreemap,
    dbmsTreemap,
    agents,
    recentAlerts,
    projectsCount,
    restorationsCount,
    agentAccess,
  ] = await Promise.all([
    getCriticalAlerts24h(scope),
    getTotalNotifications24h(scope),
    getDatabasesAvailability(scope),
    getAgentsAvailability(scope),
    getBackupCounts(scope),
    getBackupEvolution(scope),
    getStorageTreemap(scope),
    getDbmsTreemap(scope),
    getAgentsWithRecentHealthchecks(scope),
    getNotificationHistory({
      level: "critical",
      limit: 5,
      organizationIds: scope,
    }),
    getProjectsCount(scope),
    getRestorationsCount(scope),
    getAgentLinkAccess(),
    refreshDashboardViews(),
  ]);

  return (
    <Page>
      <PageHeader>
        <PageTitle>{organization.name}</PageTitle>
      </PageHeader>
      <PageContent className="flex flex-col gap-y-4">
        <StatsLayout
          agentAccess={agentAccess}
          data={{
            alerts24h,
            totalNotifications24h,
            dbStats,
            agentStats,
            backupCounts,
            evolution,
            storageTreemap,
            dbmsTreemap,
            agents,
            recentAlerts: recentAlerts ?? [],
            organizationCount: 1,
            projectsCount,
            restorationsCount,
          }}
        />
      </PageContent>
    </Page>
  );
}
