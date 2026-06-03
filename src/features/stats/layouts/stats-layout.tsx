// src/features/stats/layouts/stats-layout.tsx
"use client"

import type { DashboardData } from "@/features/stats/types"
import { getAvailabilityColor } from "@/features/stats/utils/availability-color"
import { KpiCard } from "@/features/stats/components/kpi/kpi-card"
import { BackupEvolutionChart } from "@/features/stats/components/backup-evolution/backup-evolution-chart"
import { StorageTreemap } from "@/features/stats/components/storage-volume/storage-treemap"
import { DatabaseTreemap } from "@/features/stats/components/database-volume/database-treemap"
import { NotificationPanel } from "@/features/stats/components/notification/notification-panel"
import { AgentStatusGrid } from "@/features/stats/components/agent-status/agent-status-grid"

type Props = {
  data: DashboardData
}

export function StatsLayout({ data }: Props) {
  const { alerts24h, dbStats, agentStats, backupCounts } = data

  const backupRate = backupCounts.possessionRatePct
    ? parseFloat(String(backupCounts.possessionRatePct))
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Alertes 24h"
          value={String(alerts24h)}
          subtitle="Alertes critiques aujourd'hui"
          statusColor="neutral"
        />
        <KpiCard
          title="Base de données"
          value={`${dbStats.availabilityPct}%`}
          subtitle={`Soit ${dbStats.total} actif`}
          statusColor={getAvailabilityColor(dbStats.availabilityPct)}
        />
        <KpiCard
          title="Agents"
          value={`${agentStats.availabilityPct}%`}
          subtitle={`Soit ${agentStats.upCount} en ligne`}
          statusColor={getAvailabilityColor(agentStats.availabilityPct)}
        />
        <KpiCard
          title="Backup"
          value={backupCounts.availableCount != null && backupCounts.totalDone != null
            ? `${backupCounts.availableCount}/${backupCounts.totalDone}`
            : "—"}
          subtitle={backupRate != null ? `${backupRate}% disponibles` : "Aucun backup"}
          statusColor={backupRate != null ? getAvailabilityColor(backupRate) : "neutral"}
        />
      </div>

      {/* Row 2 — Evolution + Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <BackupEvolutionChart data={data.evolution} />
        </div>
        <div className="md:col-span-1">
          <NotificationPanel alerts={data.recentAlerts} />
        </div>
      </div>

      {/* Row 3 — Agent Status + Treemaps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentStatusGrid agents={data.agents} />
        <StorageTreemap data={data.storageTreemap} />
        <DatabaseTreemap data={data.dbmsTreemap} />
      </div>
    </div>
  )
}
