"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { HealthcheckLog } from "@/db/schema/15_healthcheck-log";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

type LogEntry = Pick<HealthcheckLog, "date" | "status">;

interface HealthCheckData {
  timestamp: Date;
  status: HealthStatus;
}

interface Props {
  logs: LogEntry[];
  type?: "full" | "compact";
  title?: string;
  href?: string;
  firstCheckAt?: Date | null;
}

const FULL_INTERVAL_MINUTES = 10;
const COMPACT_INTERVAL_MINUTES = 30;
const WINDOW_HOURS = 12;

function roundDateToInterval(date: Date, intervalMinutes: number): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function buildTimeSeries(
  logs: LogEntry[],
  intervalMinutes: number,
): HealthCheckData[] {
  const intervalMs = intervalMinutes * 60 * 1000;
  const now = new Date();
  const roundedNow = roundDateToInterval(now, intervalMinutes);

  const buckets = (WINDOW_HOURS * 60) / intervalMinutes;
  const data: HealthCheckData[] = [];
  const oldestLog = logs.length > 0 ? getOldestLog(logs) : null;
  for (let i = buckets - 1; i >= 0; i--) {
    const start = new Date(roundedNow.getTime() - i * intervalMs);
    const end = new Date(start.getTime() + intervalMs);

    const bucketLogs = logs.filter(
      (l) => l.date && new Date(l.date) >= start && new Date(l.date) < end,
    );

    let status: HealthStatus = "unknown";

    if (!oldestLog || new Date(oldestLog.date!) > start) {
      status = "unknown";
    } else if (new Date(oldestLog.date!) < start) {
      status = "down";
    }

    if (bucketLogs.length > 0) {
      const hasFailure = bucketLogs.some((l) => l.status === "failed");
      const hasSuccess = bucketLogs.some((l) => l.status === "success");

      if (hasFailure && hasSuccess) {
        status = "degraded";
      } else if (hasFailure) {
        status = "down";
      } else if (hasSuccess) {
        status = "healthy";
      }
    }

    data.push({ timestamp: start, status });
  }

  return data;
}

function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-500";
    case "degraded":
      return "bg-emerald-700";
    case "down":
      return "bg-red-500";
    case "unknown":
      return "bg-zinc-700";
  }
}

function getOldestLog(logs: LogEntry[]): LogEntry {
  const validLogs = logs.filter((l) => l.date);

  return validLogs.reduce((oldest, current) =>
    new Date(current.date!) < new Date(oldest.date!) ? current : oldest,
  );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
}

export const HealthCheckGraph = ({ logs, type = "full", title, href }: Props) => {
  const intervalMinutes =
    type === "compact" ? COMPACT_INTERVAL_MINUTES : FULL_INTERVAL_MINUTES;

  const data = useMemo(() => {
    return buildTimeSeries(logs, intervalMinutes);
  }, [logs, intervalMinutes]);

  const uptimeData = useMemo(() => {
    return buildTimeSeries(logs, FULL_INTERVAL_MINUTES);
  }, [logs]);

  const isMobile = useIsMobile();

  const hourLabels = useMemo(() => {
    if (data.length === 0) return [];

    return data
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const hours = item.timestamp.getHours();
        const minutes = item.timestamp.getMinutes();
        if (isMobile) {
          return minutes === 0 && hours % 3 === 0;
        } else {
          return minutes === 0;
        }
      })
      .map(({ item, index }) => ({
        hour: formatTime(item.timestamp),
        index,
      }));
  }, [data]);

  const knownData = uptimeData.filter((d) => d.status !== "unknown");
  const uptimePercent =
    knownData.length > 0
      ? (
          (knownData.filter((d) => d.status === "healthy").length /
            knownData.length) *
          100
        ).toFixed(1)
      : "0.0";

  if (type === "compact") {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md w-56">
        <div className="flex items-center justify-between mb-2">
          <div>
            {title && href ? (
              <Link
                href={href}
                className="text-xs font-semibold truncate hover:underline"
              >
                {title}
                <SquareArrowOutUpRight
                  className="inline-block ml-1"
                  size={12}
                />
              </Link>
            ) : title ? (
              <p className="text-xs font-semibold truncate">{title}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Last 12h</p>
          </div>
          <p className="text-emerald-400 text-sm font-bold">{uptimePercent}%</p>
        </div>

        <div className="flex gap-0.5">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex-1 h-5 rounded-sm ${getStatusColor(item.status)} hover:ring-1 hover:ring-zinc-400 transition-all cursor-default`}
              title={`${formatTime(item.timestamp)} — ${item.status}`}
            />
          ))}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>-12h</span>
          <span>-6h</span>
          <span>now</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-zinc-500">
          <Legend color="bg-zinc-700" label="Unknown" />
          <Legend color="bg-red-500" label="Down" />
          <Legend color="bg-emerald-700" label="Degraded" />
          <Legend color="bg-emerald-500" label="Healthy" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full">
        <Card className="h-full flex flex-col p-4 border-border/50 bg-card gap-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{title ?? "Health"}</h2>
              <p className="text-zinc-500 text-sm">
                Last 12 hours • {FULL_INTERVAL_MINUTES} minut
                {FULL_INTERVAL_MINUTES <= 1 ? "e" : "es"} intervals
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 text-2xl font-bold">
                {uptimePercent}%
              </p>
              <p className="text-zinc-500 text-sm">Uptime</p>
            </div>
          </div>

          <div className="relative mb-1 h-4 text-xs text-zinc-500">
            {hourLabels.map((label, i) => {
              const left = (label.index / (data.length - 1)) * 100;

              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${left}%` }}
                >
                  {label.hour}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0.5">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex-1 h-8 rounded-sm ${getStatusColor(item.status)} hover:ring-2 hover:ring-zinc-400 transition-all cursor-pointer`}
                title={`${formatTime(item.timestamp)} - ${item.status}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 mt-4 text-xs text-zinc-500">
            <Legend color="bg-zinc-700" label="Unknown" />
            <Legend color="bg-red-500" label="Down" />
            <Legend color="bg-emerald-700" label="Degraded" />
            <Legend color="bg-emerald-500" label="Healthy" />
          </div>
        </Card>
      </div>
    </div>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3 h-3 rounded-sm ${color}`} />
    <span>{label}</span>
  </div>
);
