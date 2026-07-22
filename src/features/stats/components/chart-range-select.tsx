"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export type ChartRange = "3d" | "30d" | "90d" | "all";

export const DEFAULT_CHART_RANGE: ChartRange = "30d";
export const DEFAULT_MOBILE_CHART_RANGE: ChartRange = "3d";

const RANGE_DAYS: Record<Exclude<ChartRange, "all">, number> = {
  "3d": 3,
  "30d": 30,
  "90d": 90,
};

const RANGE_LABELS: Record<ChartRange, string> = {
  "3d": "Last 3 days",
  "30d": "Last 30 days",
  "90d": "Last 3 months",
  all: "All time",
};

export function filterByRange<T extends { period: Date | string }>(
  rows: T[],
  range: ChartRange,
): T[] {
  if (range === "all") return rows;

  const start = new Date();
  start.setDate(start.getDate() - RANGE_DAYS[range]);
  start.setHours(0, 0, 0, 0);

  return rows.filter((row) => new Date(row.period) >= start);
}

export function useChartRange() {
  const isMobile = useIsMobile();
  const [chosen, setChosen] = useState<ChartRange | null>(null);

  return {
    range:
      chosen ?? (isMobile ? DEFAULT_MOBILE_CHART_RANGE : DEFAULT_CHART_RANGE),
    setRange: setChosen,
    isMobile,
  };
}

type Props = {
  value: ChartRange;
  onChange: (range: ChartRange) => void;
};

export function ChartRangeSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChartRange)}>
      <SelectTrigger
        className="h-7 w-35 text-xs"
        aria-label="Select a time range"
      >
        <SelectValue placeholder={RANGE_LABELS[DEFAULT_CHART_RANGE]} />
      </SelectTrigger>
      <SelectContent >
        {(Object.keys(RANGE_LABELS) as ChartRange[]).map((range) => (
          <SelectItem key={range} value={range} className="text-xs">
            {RANGE_LABELS[range]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
