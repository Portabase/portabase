import type { TooltipProps } from "recharts";
import { formatBytes } from "@/features/stats/utils/format-bytes";
import { format } from "date-fns";

type TooltipPayload = {
  period: string;
  totalBytes: number;
  successCount: number;
};

type Props = TooltipProps<number, string>;

export function BackupEvolutionTooltip({ active, payload }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as TooltipPayload;
  const dateLabel = format(new Date(data.period), "dd MMM yyyy");

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-medium mb-1">{dateLabel}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-muted-foreground">Size :</span>
        <span className="ml-auto font-semibold">
          {formatBytes(data.totalBytes)}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="h-2 w-2 rounded-full bg-foreground" />
        <span className="text-muted-foreground">Backups :</span>
        <span className="ml-auto font-semibold">{data.successCount}</span>
      </div>
    </div>
  );
}
