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
import { formatBytes } from "@/features/stats/utils/format-bytes";

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

  const backupRate =
    backupCounts.possessionRatePct > 0 ? backupCounts.possessionRatePct : null;

  const totalStorageBytes = data.storageTreemap.reduce(
    (sum, row) => sum + row.totalBytes,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthRingChart
          dbAvailabilityPct={dbStats.availabilityPct}
          dbTotal={dbStats.total}
          agentAvailabilityPct={agentStats.availabilityPct}
          agentTotal={agentStats.total}
          alerts24h={alerts24h}
          totalNotifications24h={totalNotifications24h}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          <KpiCard
            title="Agents"
            value={agentStats.total === 0 ? "—" : `${agentStats.availabilityPct}%`}
            subtitle={`${agentStats.upCount}/${agentStats.total} online`}
            statusColor={
              agentStats.total === 0
                ? "unknown"
                : getAvailabilityColor(agentStats.availabilityPct)
            }
            tooltip={
              <p className="text-xs">
                Percentage of agents that contacted the server in the last 10 minutes.
                An agent is considered offline after 30 minutes without contact.
              </p>
            }
          />
          <KpiCard
            title="Databases"
            value={dbStats.total === 0 ? "—" : `${dbStats.availabilityPct}%`}
            subtitle={`${dbStats.upCount}/${dbStats.total} online`}
            statusColor={
              dbStats.total === 0
                ? "unknown"
                : getAvailabilityColor(dbStats.availabilityPct)
            }
            tooltip={
              <p className="text-xs">
                Percentage of databases reachable by their agent in the last 10 minutes.
              </p>
            }
          />
          <KpiCard
            title="Alerts notification in last 24h"
            value={String(alerts24h)}
            subtitle={`${alerts24h} critical / ${totalNotifications24h} total`}
            statusColor={
              totalNotifications24h === 0
                ? "unknown"
                : getAvailabilityColor(
                    Math.round((1 - alerts24h / totalNotifications24h) * 100),
                  )
            }
            tooltip={
              <p className="text-xs">
                Ratio of critical alerts (backup failure, restore failure, health error)
                over all notifications sent in the last 24 hours.
              </p>
            }
          />
          <KpiCard
            title="Backup"
            value={
              backupCounts.totalDone > 0
                ? `${backupCounts.availableCount}/${backupCounts.totalDone}`
                : "—"
            }
            subtitle={
              backupRate != null
                ? `${backupRate}% available · ${formatBytes(totalStorageBytes)}`
                : "No backup"
            }
            tooltip={
              <p className="text-xs">
                Available backups vs total executed. A backup is available when it
                completed successfully and has not been deleted by a retention policy.
              </p>
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
