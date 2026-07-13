
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
import { getNotificationHistory } from "@/db/services/notification-log";
import { Page, PageActions, PageContent, PageHeader, PageTitle } from "@/features/layout/components/page";

export const metadata: Metadata = { title: "Home" };

export default async function RoutePage() {
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
  ] = await Promise.all([
    getCriticalAlerts24h(),
    getTotalNotifications24h(),
    getDatabasesAvailability(),
    getAgentsAvailability(),
    getBackupCounts(),
    getBackupEvolution(),
    getStorageTreemap(),
    getDbmsTreemap(),
    getAgentsWithRecentHealthchecks(),
    getNotificationHistory({ level: "critical", limit: 5 }),
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
          }}
        />
      </PageContent>
    </Page>
  );
}
