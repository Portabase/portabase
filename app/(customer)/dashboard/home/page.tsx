
import { Metadata } from "next";
import { StatsLayout } from "@/features/stats/layouts/stats-layout";
import { RefreshDashboardButton } from "@/features/stats/components/refresh-dashboard-button";
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
import { getOrganizationCount } from "@/features/stats/queries/organization.queries";
import {
  getAgentLinkAccess,
  getDashboardScope,
} from "@/features/stats/queries/scope.queries";
import { getNotificationHistory } from "@/db/services/notification-log";
import { Page, PageActions, PageContent, PageHeader, PageTitle } from "@/features/layout/components/page";
import { refreshDashboardViews } from "@/features/stats/queries/views.queries";

export const metadata: Metadata = { title: "Home" };

export default async function RoutePage() {
  const scope = await getDashboardScope();

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
    organizationCount,
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
      ...(scope ? { organizationIds: scope } : {}),
    }),
    getOrganizationCount(scope),
    getAgentLinkAccess(),
    refreshDashboardViews(),
  ]);

  return (
    <Page>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
        <PageActions>
          <RefreshDashboardButton />
        </PageActions>
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
            organizationCount,
          }}
        />
      </PageContent>
    </Page>
  );
}
