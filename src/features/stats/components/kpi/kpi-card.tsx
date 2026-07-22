import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type StatusColor,
  STATUS_COLOR_MAP,
} from "@/features/stats/utils/availability-color";
import { InfoTooltip } from "@/features/stats/components/info-tooltip";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  statusColor?: StatusColor;
  tooltip?: ReactNode;
};

export function KpiCard({ title, value, subtitle, statusColor, tooltip }: KpiCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {statusColor && (
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              STATUS_COLOR_MAP[statusColor],
              statusColor !== "unknown" && "animate-pulse",
            )}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
