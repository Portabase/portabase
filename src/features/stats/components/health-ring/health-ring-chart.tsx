// src/features/stats/components/health-ring/health-ring-chart.tsx
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
  backupRatePct: number;
  alerts24h: number;
};

type RingDatum = {
  name: string;
  value: number;
  fill: string;
  description: string;
};

function computeAlertHealth(alerts24h: number): number {
  return Math.max(0, 100 - alerts24h * 10);
}

function computeGlobalScore(values: number[]): number {
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function getThresholdLabel(value: number, isAlert = false): string {
  if (isAlert) {
    if (value >= 60) return "✓ Bonne santé";
    if (value >= 30) return "⚠ Alertes modérées";
    return "✗ Nombreuses alertes";
  }
  if (value >= 80) return "✓ Bonne disponibilité";
  if (value >= 60) return "⚠ Disponibilité partielle";
  return "✗ Disponibilité critique";
}

function HealthTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RingDatum;
  const isAlert = d.name === "Santé alertes";
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
  backupRatePct,
  alerts24h,
}: HealthRingChartProps) {
  const alertHealthPct = computeAlertHealth(alerts24h);
  const globalScore = computeGlobalScore([
    dbAvailabilityPct,
    agentAvailabilityPct,
    backupRatePct,
    alertHealthPct,
  ]);

  // recharts RadialBarChart: innermost item = last in array
  // Visual order: DB (outer) → Agents → Backup → Alertes (inner)
  const ringData: RingDatum[] = [
    {
      name: "Santé alertes",
      value: alertHealthPct,
      fill: "#ef4444",
      description: `${alerts24h} alerte${alerts24h > 1 ? "s" : ""} critique${alerts24h > 1 ? "s" : ""} (24h)`,
    },
    {
      name: "Backup",
      value: backupRatePct,
      fill: "#f97316",
      description: `${backupRatePct.toFixed(1)}% backups disponibles`,
    },
    {
      name: "Agents",
      value: agentAvailabilityPct,
      fill: "#22c55e",
      description: `${agentAvailabilityPct.toFixed(1)}% agents en ligne`,
    },
    {
      name: "Disponibilité DB",
      value: dbAvailabilityPct,
      fill: "#3b82f6",
      description: `${dbAvailabilityPct.toFixed(1)}% bases joignables`,
    },
  ];

  const scoreColor =
    globalScore >= 80 ? "#22c55e" : globalScore >= 60 ? "#f97316" : "#ef4444";

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Santé globale</CardTitle>
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

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="rounded-full bg-background/90 px-4 py-2 flex flex-col items-center shadow-sm border">
              <span
                className="text-2xl font-bold leading-none"
                style={{ color: scoreColor }}
                aria-label={`Score de santé global : ${globalScore}%`}
              >
                {globalScore}%
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">global</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
