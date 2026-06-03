"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseBackup } from "lucide-react";
import { BackupEvolutionTooltip } from "./backup-evolution-tooltip";
import { getByteUnit, bytesToUnit } from "@/features/stats/utils/format-bytes";
import type { EvolutionRow } from "@/features/stats/queries/backup.queries";
import { format } from "date-fns";

type Props = {
  data: EvolutionRow[];
};

function detectGranularity(data: { period: string }[]): "week" | "month" {
  if (data.length < 2) return "month";
  const gap =
    new Date(data[1].period).getTime() - new Date(data[0].period).getTime();
  return gap / (1000 * 60 * 60 * 24) < 15 ? "week" : "month";
}

export function BackupEvolutionChart({ data }: Props) {
  const maxBytes = Math.max(...data.map((d) => d.totalBytes ?? 0));
  const unit = getByteUnit(maxBytes);

  const chartData = data.map((d) => ({
    period: d.period ? new Date(d.period).toISOString() : "",
    totalBytes: d.totalBytes ?? 0,
    backupCount: d.backupCount ?? 0,
    sizeDisplay: bytesToUnit(d.totalBytes ?? 0, unit),
  }));

  const granularity = detectGranularity(chartData);

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Backup History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-40 gap-2">
          <DatabaseBackup className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No backups recorded</p>
          <p className="text-xs text-muted-foreground/60">Backups will appear here once your first backup completes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Backup History</CardTitle>
        <p className="text-xs text-muted-foreground">
          A summary of all Portabase locations
        </p>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={chartData}
            margin={{ left: 0, right: 16, top: 4, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) =>
                granularity === "week"
                  ? format(new Date(v), "dd MMM")
                  : format(new Date(v), "MMM yy")
              }
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
            <Tooltip content={<BackupEvolutionTooltip granularity={granularity} />} />
            <Legend
              formatter={(value) =>
                value === "backupCount" ? "Quantity" : `Size (${unit})`
              }
            />
            <Line
              yAxisId="left"
              dataKey="backupCount"
              type="monotone"
              stroke="#06c978"
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
  );
}
