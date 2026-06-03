"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProviderColor,
  getProviderLabel,
} from "@/features/stats/utils/provider-colors";
import { formatBytes } from "@/features/stats/utils/format-bytes";
import type { mvKpiStorageTreemap } from "@/db/schema/16_dashboard-views";

type StorageRow = typeof mvKpiStorageTreemap.$inferSelect;

type Props = {
  data: StorageRow[];
};

type TreemapItem = {
  name: string;
  size: number;
  fill: string;
  provider: string;
  backupCount: number;
};

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
      <p className="text-muted-foreground">{formatBytes(d.size)}</p>
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
    size,
    value,
  } = props;
  const bytes = size ?? value ?? 0;
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

export function StorageTreemap({ data }: Props) {
  const grandTotal = data.reduce((s, r) => s + (r.totalBytes ?? 0), 0);

  const treeData: TreemapItem[] = data.map((r) => ({
    name: getProviderLabel(r.provider ?? ""),
    size: r.totalBytes ?? 0,
    fill: getProviderColor(r.provider ?? ""),
    provider: r.provider ?? "",
    backupCount: r.backupCount ?? 0,
  }));

  if (treeData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Storage capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No storage data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Storage capacity
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Total size of backup files
          </p>
        </div>
        <span className="text-sm font-semibold">{formatBytes(grandTotal)}</span>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <Treemap data={treeData} dataKey="size" content={<TreemapContent />}>
            <Tooltip content={<StorageTooltipContent />} />
          </Treemap>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {treeData.map((item) => (
            <div
              key={item.provider}
              className="flex items-center gap-1.5 text-xs"
            >
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
