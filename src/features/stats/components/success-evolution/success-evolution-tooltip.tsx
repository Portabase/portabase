import type { TooltipProps } from "recharts";
import { format } from "date-fns";

type TooltipPayload = {
  period: string;
  successRate: number | null;
  successCount: number;
  failedCount: number;
  finishedCount: number;
};

type Props = TooltipProps<number, string>;

export function SuccessEvolutionTooltip({ active, payload }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as TooltipPayload;
  if (data.successRate == null) return null;

  const dateLabel = format(new Date(data.period), "dd MMM yyyy");

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-medium mb-1">{dateLabel}</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#06c978]" />
        <span className="text-muted-foreground">Success rate :</span>
        <span className="ml-auto font-semibold">
          {data.successRate.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="h-2 w-2 rounded-full bg-foreground" />
        <span className="text-muted-foreground">Succeeded :</span>
        <span className="ml-auto font-semibold">
          {data.successCount}/{data.finishedCount}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-muted-foreground">Failed :</span>
        <span className="ml-auto font-semibold">{data.failedCount}</span>
      </div>
    </div>
  );
}
