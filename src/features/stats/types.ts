// src/features/stats/types.ts
import { type Agent } from "@/db/schema/08_agent"
import { type NotificationLog } from "@/db/schema/11_notification-log"
import { type HealthcheckLog } from "@/db/schema/15_healthcheck-log"
import {
  mvKpiBackupCounts,
  mvKpiEvolutionMonthly,
  mvKpiStorageTreemap,
  mvKpiDbmsTreemap,
} from "@/db/schema/16_dashboard-views"

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
  dbStats: KpiAvailability
  agentStats: KpiAvailability
  backupCounts: typeof mvKpiBackupCounts.$inferSelect
  evolution: (typeof mvKpiEvolutionMonthly.$inferSelect)[]
  storageTreemap: (typeof mvKpiStorageTreemap.$inferSelect)[]
  dbmsTreemap: (typeof mvKpiDbmsTreemap.$inferSelect)[]
  recentAlerts: Pick<NotificationLog, "id" | "event" | "title" | "level" | "sentAt">[]
  agents: AgentWithChecks[]
}
