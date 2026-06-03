import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type StatusColor,
  STATUS_COLOR_MAP,
} from "@/features/stats/utils/availability-color";

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  statusColor?: StatusColor;
};

export function KpiCard({
  title,
  value,
  subtitle,
  statusColor = "neutral",
}: KpiCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={cn("h-3 w-3 rounded-full", STATUS_COLOR_MAP[statusColor])}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
