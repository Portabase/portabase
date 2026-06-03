"use client"

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackupEvolutionTooltip } from "./backup-evolution-tooltip"
import { getByteUnit, bytesToUnit } from "@/features/stats/utils/format-bytes"
import type { mvKpiEvolutionMonthly } from "@/db/schema/16_dashboard-views"
import { format } from "date-fns"

type EvolutionRow = typeof mvKpiEvolutionMonthly.$inferSelect

type Props = {
  data: EvolutionRow[]
}

export function BackupEvolutionChart({ data }: Props) {
  const maxBytes = Math.max(...data.map((d) => d.totalBytes ?? 0))
  const unit = getByteUnit(maxBytes)

  const chartData = data.map((d) => ({
    period: d.period ? new Date(d.period).toISOString() : "",
    totalBytes: d.totalBytes ?? 0,
    backupCount: d.backupCount ?? 0,
    sizeDisplay: bytesToUnit(d.totalBytes ?? 0, unit),
  }))

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Évolution des backups dans le temps</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Aucun backup enregistré
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Évolution des backups dans le temps</CardTitle>
        <p className="text-xs text-muted-foreground">Sommé de toutes les bases de Portabase</p>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => format(new Date(v), "MMM yy")}
              className="text-xs"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => String(v)}
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}${unit}`}
              className="text-xs"
            />
            <Tooltip content={<BackupEvolutionTooltip />} />
            <Legend
              formatter={(value) =>
                value === "backupCount" ? "Quantité" : `Taille (${unit})`
              }
            />
            <Line
              yAxisId="left"
              dataKey="backupCount"
              type="monotone"
              stroke="#18181b"
              strokeWidth={2}
              dot={false}
              name="backupCount"
            />
            <Line
              yAxisId="right"
              dataKey="sizeDisplay"
              type="monotone"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="sizeDisplay"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
