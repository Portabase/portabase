"use client";

import {ChartConfig, ChartTooltip} from "@/components/ui/chart";
import {EStatusSchema} from "@/db/schema/types";
import {LineChartCustom} from "@/components/wrappers/dashboard/statistics/charts/line-chart";
import {CartesianGrid, TooltipProps, XAxis, YAxis} from "recharts";
import {formatDayOnly} from "@/utils/date-formatting";

type Data = {
    createdAt: Date;
    status: EStatusSchema;
    _count: number;
};

type Payload = {
    date: string
    successRate: number
}

export type percentageLineChartProps = {
    data: Data[];
};

export function PercentageLineChart(props: percentageLineChartProps) {
    const {data} = props;


    const dailyStats = data.reduce(
        (acc, backup) => {
            const date = backup.createdAt.toISOString().split("T")[0];
            const status = backup.status;

            if (!acc[date]) {
                acc[date] = {success: 0, failed: 0, total: 0};
            }

            acc[date][status === "success" ? "success" : "failed"] += backup._count;
            acc[date].total += backup._count;

            return acc;
        },
        {} as Record<string, { success: number; failed: number; total: number }>
    );

    const formattedData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        successRate: (stats.success / stats.total) * 100,
    }));


    const chartConfig = {
        date: {
            label: "Date",
        },
        successRate: {
            label: "Success Rate",
        },
    } satisfies ChartConfig;

    return (

        <LineChartCustom<Payload>
            title="Success rate of backups"
            config={chartConfig}
            data={formattedData}
            dataKey="successRate"
            margin={{
                left: -15,
                right: 12,
            }}
        >
            {/*<CartesianGrid strokeDasharray="3 3" />*/}
            <CartesianGrid vertical={false}/>
            <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                    formatDayOnly(new Date(value))
                }
            />
            <YAxis
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(tick) => `${Number(tick).toFixed(0)}%`}
            />
            <ChartTooltip
                defaultIndex={1}
                cursor={{strokeDasharray: "3 3"}}
                content={<PourcentTooltip/>}
            />
        </LineChartCustom>
    );
}

function PourcentTooltip({
                             active,
                             payload,
                         }: TooltipProps<number, string>) {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload as Payload;

    return (
        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
            <p className="text-sm font-medium">
                {formatDayOnly(new Date(data.date))}
            </p>

            <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-[#fc6504]"/>
                <span className="text-muted-foreground">Success Rate :</span>
                <span className="ml-auto font-semibold">
          {data.successRate.toFixed(0)} %
        </span>
            </div>
        </div>
    );
}


