"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TooltipProps } from "recharts";

type HealthRingChartProps = {
  dbAvailabilityPct: number;
  agentAvailabilityPct: number;
  alerts24h: number;
  totalNotifications24h: number;
};

type RingDatum = {
  name: string;
  value: number;
  fill: string;
  description: string;
};

function computeAlertHealth(alerts24h: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((1 - alerts24h / total) * 100);
}

function computeGlobalScore(values: number[]): number {
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function getThresholdLabel(value: number, isAlert = false): string {
  if (isAlert) {
    if (value >= 60) return "Good health";
    if (value >= 30) return "Moderate alerts";
    return "Numerous alerts";
  }
  if (value >= 80) return "Good availability";
  if (value >= 60) return "Degraded availability";
  return "Critical availability";
}

function HealthTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RingDatum;
  const isAlert = d.name === "Health Alerts";
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs w-44">
      <p className="font-semibold mb-1" style={{ color: d.fill }}>
        {d.name}
      </p>
      <p className="text-muted-foreground">{d.description}</p>
      <p className="font-bold mt-1">{d.value.toFixed(1)}%</p>
      <p className="text-muted-foreground mt-0.5">
        {getThresholdLabel(d.value, isAlert)}
      </p>
    </div>
  );
}

export function HealthRingChart({
  dbAvailabilityPct,
  agentAvailabilityPct,
  alerts24h,
  totalNotifications24h,
}: HealthRingChartProps) {
  const alertHealthPct = computeAlertHealth(alerts24h, totalNotifications24h);
  const globalScore = computeGlobalScore([
    dbAvailabilityPct,
    agentAvailabilityPct,
    alertHealthPct,
  ]);

  const ringData: RingDatum[] = [
    {
      name: "Health Alerts",
      value: alertHealthPct,
      fill: "#ef4444",
      description: `${alerts24h} critical / ${totalNotifications24h} total (24h)`,
    },
    {
      name: "Agents",
      value: agentAvailabilityPct,
      fill: "#22c55e",
      description: `${agentAvailabilityPct.toFixed(1)}% agents online`,
    },
    {
      name: "DB Availability",
      value: dbAvailabilityPct,
      fill: "#3b82f6",
      description: `${dbAvailabilityPct.toFixed(1)}% databases reachable`,
    },
  ];

  const scoreColor =
    globalScore >= 80 ? "#22c55e" : globalScore >= 60 ? "#f97316" : "#ef4444";

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Global Health</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="relative w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={ringData}
              startAngle={220}
              endAngle={-40}
              innerRadius="30%"
              outerRadius="90%"
              barSize={12}
            >
              <RadialBar
                dataKey="value"
                background={{ fill: "#e5e7eb", opacity: 0.8 }}
                cornerRadius={5}
              />
              <Tooltip content={<HealthTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div
            className="pointer-events-none absolute flex flex-col items-center"
            style={{
              bottom: "12%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <span
              className="text-2xl font-medium leading-none"
              style={{ color: scoreColor }}
            >
              {globalScore}%
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Score
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
