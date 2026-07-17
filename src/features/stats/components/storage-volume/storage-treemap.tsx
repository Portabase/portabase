"use client";

import { useMemo, useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getChannelColor,
  getProviderColor,
  getProviderLabel,
} from "@/features/stats/utils/provider-colors";
import { formatBytes } from "@/features/stats/utils/format-bytes";
import type { StorageTreemapRow as StorageRow } from "@/features/stats/queries/storage.queries";
import { InfoTooltip } from "@/features/stats/components/info-tooltip";
import { StorageTreemapInfo } from "./storage-treemap.info";

type Props = {
  data: StorageRow[];
};

type GroupBy = "channel" | "provider";

const GROUP_BY_LABELS: Record<GroupBy, string> = {
  channel: "By channel",
  provider: "By type",
};

type TreemapItem = {
  key: string;
  size: number;
  totalBytes: number;
  name: string;
  subLabel: string;
  fill: string;
  backupCount: number;
};

const MIN_AREA_SHARE = 0.03;

function StorageTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TreemapItem }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-medium">{d.name}</p>
      {d.subLabel && <p className="text-muted-foreground">{d.subLabel}</p>}
      <p className="text-muted-foreground">{formatBytes(d.totalBytes)}</p>
      <p className="text-muted-foreground">{d.backupCount} backups</p>
    </div>
  );
}

function TreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
  totalBytes?: number;
  size?: number;
  value?: number;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name,
    fill,
    totalBytes,
    size,
    value,
  } = props;
  const bytes = totalBytes ?? size ?? value ?? 0;
  if (width < 40 || height < 30)
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
      <text
        x={x + width / 2}
        y={y + height / 2 - 6}
        textAnchor="middle"
        fill="#fff"
        fontSize={12}
        fontWeight={600}
      >
        {name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 10}
        textAnchor="middle"
        fill="#fff"
        fontSize={10}
        opacity={0.85}
      >
        {formatBytes(bytes)}
      </text>
    </g>
  );
}

function byProvider(data: StorageRow[]): Omit<TreemapItem, "size">[] {
  const totals = new Map<string, { totalBytes: number; backupCount: number }>();

  for (const row of data) {
    const current = totals.get(row.provider) ?? { totalBytes: 0, backupCount: 0 };
    current.totalBytes += row.totalBytes ?? 0;
    current.backupCount += row.backupCount ?? 0;
    totals.set(row.provider, current);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
    .map(([provider, t]) => ({
      key: provider,
      name: getProviderLabel(provider),
      subLabel: "",
      fill: getProviderColor(provider),
      totalBytes: t.totalBytes,
      backupCount: t.backupCount,
    }));
}

function byChannel(data: StorageRow[]): Omit<TreemapItem, "size">[] {
  const seenPerProvider = new Map<string, number>();

  return [...data]
    .sort((a, b) => b.totalBytes - a.totalBytes)
    .map((row) => {
      const indexInProvider = seenPerProvider.get(row.provider) ?? 0;
      seenPerProvider.set(row.provider, indexInProvider + 1);

      return {
        key: row.channelId,
        name: row.channelName,
        subLabel: getProviderLabel(row.provider),
        fill: getChannelColor(row.provider, indexInProvider),
        totalBytes: row.totalBytes ?? 0,
        backupCount: row.backupCount ?? 0,
      };
    });
}

export function StorageTreemap({ data }: Props) {
  const isMobile = useIsMobile();
  const [groupBy, setGroupBy] = useState<GroupBy>("channel");

  const grandTotal = data.reduce((s, r) => s + (r.totalBytes ?? 0), 0);

  const treeData: TreemapItem[] = useMemo(() => {
    const areaFloor = grandTotal * MIN_AREA_SHARE;
    const grouped = groupBy === "provider" ? byProvider(data) : byChannel(data);

    return grouped.map((item) => ({
      ...item,
      size: Math.max(item.totalBytes, areaFloor, 1),
    }));
  }, [data, groupBy, grandTotal]);

  const header = (
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <CardTitle className="truncate text-sm font-medium">
            Storage capacity
          </CardTitle>
          <InfoTooltip content={<StorageTreemapInfo />} />
        </div>
        <p className="text-xs text-muted-foreground">
          Total size of backup files
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tabular-nums">
          {formatBytes(grandTotal)}
        </span>
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger
            className="h-7 w-35 text-xs"
            aria-label="Group storage by"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GROUP_BY_LABELS) as GroupBy[]).map((key) => (
              <SelectItem key={key} value={key} className="text-xs">
                {GROUP_BY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
  );

  if (treeData.length === 0) {
    return (
      <Card className="w-full min-w-0">
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">
              Storage capacity
            </CardTitle>
            <InfoTooltip content={<StorageTreemapInfo />} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-40 gap-2">
          <HardDrive className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No storage data</p>
          <p className="text-xs text-muted-foreground/60">Storage usage appears once backups are stored</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-w-0">
      {header}
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <Treemap
            data={treeData}
            dataKey="size"
            content={<TreemapContent fill="transparent" />}
          >
            <Tooltip
              content={<StorageTooltipContent />}
              trigger={isMobile ? "click" : "hover"}
            />
          </Treemap>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {treeData.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              {item.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
