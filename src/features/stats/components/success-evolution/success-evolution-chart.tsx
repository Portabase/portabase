"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck } from "lucide-react";
import { SuccessEvolutionTooltip } from "./success-evolution-tooltip";
import type { EvolutionRow } from "@/features/stats/queries/backup.queries";
import { format } from "date-fns";
import { InfoTooltip } from "@/features/stats/components/info-tooltip";
import { SuccessEvolutionInfo } from "./success-evolution.info";
import {
  ChartRangeSelect,
  filterByRange,
  useChartRange,
} from "@/features/stats/components/chart-range-select";

type Props = {
  data: EvolutionRow[];
};

export function SuccessEvolutionChart({ data }: Props) {
  const { range, setRange, isMobile } = useChartRange();

  const chartData = filterByRange(data, range).map((d) => {
    const successCount = d.successCount ?? 0;
    const failedCount = d.failedCount ?? 0;
    const finishedCount = successCount + failedCount;

    return {
      period: d.period ? new Date(d.period).toISOString() : "",
      successCount,
      failedCount,
      finishedCount,
      successRate: finishedCount === 0 ? null : (successCount / finishedCount) * 100,
    };
  });

  const totalSuccess = chartData.reduce((sum, d) => sum + d.successCount, 0);
  const totalFinished = chartData.reduce((sum, d) => sum + d.finishedCount, 0);
  const overallRate =
    totalFinished === 0 ? null : (totalSuccess / totalFinished) * 100;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">
              Backup Success Rate
            </CardTitle>
            <InfoTooltip content={<SuccessEvolutionInfo />} />
          </div>
          <p className="text-xs text-muted-foreground">
            {overallRate != null
              ? `${totalSuccess}/${totalFinished} succeeded`
              : "Share of backups that succeeded, per day"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {overallRate != null && (
            <span className="text-sm font-semibold tabular-nums">
              {overallRate.toFixed(1)}%
            </span>
          )}
          <ChartRangeSelect value={range} onChange={setRange} />
        </div>
      </CardHeader>
      {!chartData.some((d) => d.successRate != null) ? (
        <CardContent className="pb-4">
          <div className="flex flex-col items-center justify-center h-[280px] gap-2">
            <CircleCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No finished backups in this range
            </p>
            <p className="text-xs text-muted-foreground/60">
              Try a wider time range, or wait for your first backup to finish
            </p>
          </div>
        </CardContent>
      ) : (
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={
              isMobile
                ? { left: -28, right: 4, top: 4, bottom: 0 }
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
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              className="text-xs"
            />
            <Tooltip
              content={<SuccessEvolutionTooltip />}
              trigger={isMobile ? "click" : "hover"}
            />
            <Line
              dataKey="successRate"
              type="monotone"
              stroke="#06c978"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="successRate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      )}
    </Card>
  );
}
