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
import { InfoTooltip } from "@/features/stats/components/info-tooltip";
import { BackupEvolutionInfo } from "./backup-evolution.info";
import {
  ChartRangeSelect,
  filterByRange,
  useChartRange,
} from "@/features/stats/components/chart-range-select";

type Props = {
  data: EvolutionRow[];
};

export function BackupEvolutionChart({ data }: Props) {
  const { range, setRange, isMobile } = useChartRange();

  const rows = filterByRange(data, range);

  const maxBytes = rows.length
    ? Math.max(...rows.map((d) => d.totalBytes ?? 0))
    : 0;
  const unit = getByteUnit(maxBytes);

  const chartData = rows.map((d) => ({
    period: d.period ? new Date(d.period).toISOString() : "",
    totalBytes: d.totalBytes ?? 0,
    successCount: d.successCount ?? 0,
    sizeDisplay: bytesToUnit(d.totalBytes ?? 0, unit),
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">Backup History</CardTitle>
            <InfoTooltip content={<BackupEvolutionInfo />} />
          </div>
          <div className="ml-auto">
            <ChartRangeSelect value={range} onChange={setRange} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A summary of all Portabase locations
        </p>
      </CardHeader>
      {chartData.length === 0 ? (
        <CardContent className="flex flex-col items-center justify-center flex-1 gap-2">
        <DatabaseBackup className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No backups in this range
        </p>
        <p className="text-xs text-muted-foreground/60">
          Try a wider time range, or wait for your first backup to complete
        </p>
      </CardContent>):
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={chartData}
            margin={
              isMobile
                ? { left: -28, right: -20, top: 4, bottom: 0 }
                : { left: 0, right: 16, top: 4, bottom: 0 }
            }
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => format(new Date(v), "dd MMM")}
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
            <Tooltip
              content={<BackupEvolutionTooltip />}
              trigger={isMobile ? "click" : "hover"}
            />
            <Legend
              formatter={(value) =>
                value === "successCount" ? "Quantity" : `Size (${unit})`
              }
            />
            <Line
              yAxisId="left"
              dataKey="successCount"
              type="monotone"
              stroke="#06c978"
              strokeWidth={2}
              dot={false}
              name="successCount"
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
      </CardContent>}
    </Card>
  );
}
