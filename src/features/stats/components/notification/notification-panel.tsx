// src/features/stats/components/notification/notification-panel.tsx
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Server, Database, RotateCcw } from "lucide-react"
import { timeAgo } from "@/utils/date-formatting"
import type { NotificationLog } from "@/db/schema/11_notification-log"
import type { ReactNode } from "react"

type AlertItem = Pick<NotificationLog, "id" | "event" | "title" | "level" | "sentAt" | "providerName">

type Props = {
  alerts: AlertItem[]
}

const EVENT_ICONS: Record<string, ReactNode> = {
  error_backup: <Database className="h-4 w-4 text-red-500" />,
  error_restore: <RotateCcw className="h-4 w-4 text-red-500" />,
  error_health_agent: <Server className="h-4 w-4 text-red-500" />,
  error_health_database: <Database className="h-4 w-4 text-red-500" />,
}

export function NotificationPanel({ alerts }: Props) {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Dernières alertes critiques
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucune alerte critique</p>
        ) : (
          alerts.map((alert) => (
            <Link
              key={alert.id}
              href="/dashboard/notifications/logs"
              className="flex items-start gap-2 rounded-md border p-2 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="mt-0.5 shrink-0">
                {EVENT_ICONS[alert.event ?? ""] ?? <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(alert.sentAt)}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{alert.providerName}</p>
              </div>
              <Badge variant="destructive" className="text-xs shrink-0">
                {alert.level}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
