"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive } from "lucide-react";
import {
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

type TreemapItem = {
  size: number;
  totalBytes: number;
  name: string;
  fill: string;
  provider: string;
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

export function StorageTreemap({ data }: Props) {
  const isMobile = useIsMobile();
  const grandTotal = data.reduce((s, r) => s + (r.totalBytes ?? 0), 0);
  const areaFloor = grandTotal * MIN_AREA_SHARE;

  const treeData: TreemapItem[] = data.map((r) => ({
    name: getProviderLabel(r.provider ?? ""),
    size: Math.max(r.totalBytes ?? 0, areaFloor, 1),
    totalBytes: r.totalBytes ?? 0,
    fill: getProviderColor(r.provider ?? ""),
    provider: r.provider ?? "",
    backupCount: r.backupCount ?? 0,
  }));

  if (treeData.length === 0) {
    return (
      <Card className="w-full">
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">
              Storage capacity
            </CardTitle>
            <InfoTooltip content={<StorageTreemapInfo />} />
          </div>
          <p className="text-xs text-muted-foreground">
            Total size of backup files
          </p>
        </div>
        <span className="text-sm font-semibold">{formatBytes(grandTotal)}</span>
      </CardHeader>
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
