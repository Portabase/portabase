// src/features/stats/types.ts
import { type Agent } from "@/db/schema/08_agent"
import { type HealthcheckLog } from "@/db/schema/15_healthcheck-log"
import { type NotificationLogWithRelations } from "@/db/services/notification-log"
import type { BackupCountsResult, EvolutionRow } from "@/features/stats/queries/backup.queries"
import type { StorageTreemapRow } from "@/features/stats/queries/storage.queries"
import type { DbmsTreemapRow } from "@/features/stats/queries/dbms.queries"

export type KpiAvailability = {
  total: number
  upCount: number
  availabilityPct: number
}

export type AgentWithChecks = Pick<Agent, "id" | "name" | "lastContact"> & {
  recentChecks: Pick<HealthcheckLog, "date" | "status">[]
}

export type DashboardData = {
  alerts24h: number
  totalNotifications24h: number
  dbStats: KpiAvailability
  agentStats: KpiAvailability
  backupCounts: BackupCountsResult
  evolution: EvolutionRow[]
  storageTreemap: StorageTreemapRow[]
  dbmsTreemap: DbmsTreemapRow[]
  recentAlerts: NotificationLogWithRelations[]
  agents: AgentWithChecks[]
}
