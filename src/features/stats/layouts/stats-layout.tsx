"use client";

import type { DashboardData } from "@/features/stats/types";
import { getAvailabilityColor } from "@/features/stats/utils/availability-color";
import { KpiCard } from "@/features/stats/components/kpi/kpi-card";
import { BackupEvolutionChart } from "@/features/stats/components/backup-evolution/backup-evolution-chart";
import { StorageTreemap } from "@/features/stats/components/storage-volume/storage-treemap";
import { DatabaseTreemap } from "@/features/stats/components/database-volume/database-treemap";
import { NotificationPanel } from "@/features/stats/components/notification/notification-panel";
import { AgentStatusGrid } from "@/features/stats/components/agent-status/agent-status-grid";
import { HealthRingChart } from "@/features/stats/components/health-ring/health-ring-chart";

type Props = {
  data: DashboardData;
};

export function StatsLayout({ data }: Props) {
  const {
    alerts24h,
    totalNotifications24h,
    dbStats,
    agentStats,
    backupCounts,
  } = data;

  const backupRate = backupCounts.possessionRatePct
    ? parseFloat(String(backupCounts.possessionRatePct))
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthRingChart
          dbAvailabilityPct={dbStats.availabilityPct}
          agentAvailabilityPct={agentStats.availabilityPct}
          alerts24h={alerts24h}
          totalNotifications24h={totalNotifications24h}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          <KpiCard
            title="Alerts 24h"
            value={String(alerts24h)}
            subtitle="Critical alerts today"
            statusColor="neutral"
          />
          <KpiCard
            title="Databases"
            value={`${dbStats.availabilityPct}%`}
            subtitle={`${dbStats.upCount}/${dbStats.total} active`}
            statusColor={getAvailabilityColor(dbStats.availabilityPct)}
          />
          <KpiCard
            title="Agents"
            value={`${agentStats.availabilityPct}%`}
            subtitle={`${agentStats.upCount}/${agentStats.total} online`}
            statusColor={getAvailabilityColor(agentStats.availabilityPct)}
          />
          <KpiCard
            title="Backup"
            value={
              backupCounts.availableCount != null &&
              backupCounts.totalDone != null
                ? `${backupCounts.availableCount}/${backupCounts.totalDone}`
                : "—"
            }
            subtitle={
              backupRate != null ? `${backupRate}% available` : "No backup"
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <BackupEvolutionChart data={data.evolution} />
        </div>
        <div className="md:col-span-1">
          <NotificationPanel alerts={data.recentAlerts} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentStatusGrid agents={data.agents} />
        <StorageTreemap data={data.storageTreemap} />
        <DatabaseTreemap data={data.dbmsTreemap} />
      </div>
    </div>
  );
}
