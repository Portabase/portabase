// src/features/stats/mock-data.ts
import type { DashboardData } from "@/features/stats/types"

function makeDate(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

function makeChecks(agentId: string) {
  const checks = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getTime() - i * 30 * 60 * 1000)
    checks.push({
      id: `${agentId}-check-${i}`,
      kind: "agent" as const,
      date,
      status: (Math.random() > 0.15 ? "success" : "failed") as "success" | "failed",
      objectId: agentId,
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    })
  }
  return checks
}

export const DASHBOARD_MOCK: DashboardData = {
  alerts24h: 2,

  dbStats: { total: 98, upCount: 23, availabilityPct: 23 },

  agentStats: { total: 146, upCount: 89, availabilityPct: 61 },

  backupCounts: {
    availableCount: 34,
    totalDone: 67,
    possessionRatePct: "50.7",
    singleton: 1,
  },

  evolution: [
    { period: new Date("2024-01-01"), totalBytes: 419430400, backupCount: 500 },
    { period: new Date("2024-02-01"), totalBytes: 734003200, backupCount: 600 },
    { period: new Date("2024-03-01"), totalBytes: 1153433600, backupCount: 650 },
    { period: new Date("2024-04-01"), totalBytes: 1717986918, backupCount: 720 },
    { period: new Date("2024-05-01"), totalBytes: 3328599450, backupCount: 800 },
    { period: new Date("2024-06-01"), totalBytes: 4080218931, backupCount: 880 },
    { period: new Date("2024-07-01"), totalBytes: 4831838412, backupCount: 940 },
    { period: new Date("2024-08-01"), totalBytes: 5798205850, backupCount: 1000 },
    { period: new Date("2024-09-01"), totalBytes: 5154119884, backupCount: 920 },
    { period: new Date("2024-10-01"), totalBytes: 4939212390, backupCount: 750 },
  ],

  storageTreemap: [
    { provider: "google-drive", totalBytes: 268959989760, backupCount: 320 },
    { provider: "s3", totalBytes: 193922703360, backupCount: 250 },
    { provider: "local", totalBytes: 49272120320, backupCount: 80 },
  ],

  dbmsTreemap: [
    { dbms: "mariadb", totalBytes: 161823744000, databaseCount: 28, backupCount: 310 },
    { dbms: "postgresql", totalBytes: 129181032960, databaseCount: 22, backupCount: 248 },
    { dbms: "mongodb", totalBytes: 96788275200, databaseCount: 15, backupCount: 187 },
    { dbms: "redis", totalBytes: 48394137600, databaseCount: 10, backupCount: 98 },
    { dbms: "valkey", totalBytes: 24197068800, databaseCount: 6, backupCount: 44 },
    { dbms: "firebird", totalBytes: 12098534400, databaseCount: 3, backupCount: 21 },
  ],

  recentAlerts: [
    {
      id: "alert-1",
      event: "error_backup",
      title: "Backup échoué — MariaDB production",
      level: "critical",
      sentAt: makeDate(0),
      providerName: "Slack — #alerts-prod",
    },
    {
      id: "alert-2",
      event: "error_health_agent",
      title: "Agent hors ligne — agent-prod-03",
      level: "critical",
      sentAt: makeDate(0),
      providerName: "Discord — #monitoring",
    },
    {
      id: "alert-3",
      event: "error_health_database",
      title: "Base hors ligne — postgres-analytics",
      level: "critical",
      sentAt: makeDate(1),
      providerName: "Email — ops@company.io",
    },
    {
      id: "alert-4",
      event: "error_restore",
      title: "Restauration échouée — staging DB",
      level: "critical",
      sentAt: makeDate(1),
      providerName: "Slack — #alerts-staging",
    },
    {
      id: "alert-5",
      event: "error_backup",
      title: "Backup échoué — MongoDB logs",
      level: "critical",
      sentAt: makeDate(2),
      providerName: "Telegram — Portabase Bot",
    },
  ],

  agents: [
    { id: "a1", name: "agent-prod-01", lastContact: makeDate(0), recentChecks: makeChecks("a1") },
    { id: "a2", name: "agent-prod-02", lastContact: makeDate(0), recentChecks: makeChecks("a2") },
    { id: "a3", name: "agent-prod-03", lastContact: null, recentChecks: makeChecks("a3") },
    { id: "a4", name: "agent-staging-01", lastContact: makeDate(0), recentChecks: makeChecks("a4") },
    { id: "a5", name: "agent-staging-02", lastContact: makeDate(0), recentChecks: makeChecks("a5") },
    { id: "a6", name: "agent-dev-01", lastContact: makeDate(1), recentChecks: makeChecks("a6") },
    { id: "a7", name: "agent-dev-02", lastContact: makeDate(0), recentChecks: makeChecks("a7") },
    { id: "a8", name: "agent-eu-west-01", lastContact: makeDate(0), recentChecks: makeChecks("a8") },
    { id: "a9", name: "agent-eu-west-02", lastContact: makeDate(0), recentChecks: makeChecks("a9") },
    { id: "a10", name: "agent-us-east-01", lastContact: makeDate(0), recentChecks: makeChecks("a10") },
    { id: "a11", name: "agent-us-east-02", lastContact: null, recentChecks: makeChecks("a11") },
    { id: "a12", name: "agent-backup-01", lastContact: makeDate(0), recentChecks: makeChecks("a12") },
  ],
}
