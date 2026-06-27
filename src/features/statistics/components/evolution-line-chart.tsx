"use client";

import {ChartConfig, ChartTooltip} from "@/components/ui/chart";
import {CartesianGrid, TooltipProps, XAxis, YAxis} from "recharts";
import {formatDayOnly} from "@/utils/date-formatting";
import {LineChartCustom} from "@/features/statistics/components/line-chart";
import {generateFakeEvolutionData} from "@/features/statistics/utils/fake-data";

type Data = {
    createdAt: Date;
};

type Payload = {
    date: string;
    count: number;
};

type LineChartDatum = {
    date: string
    count: number
}

export type EvolutionLineChartProps = {
    data: Data[];

};

export function EvolutionLineChart(props: EvolutionLineChartProps) {
    const {data} = props;

    // const fakeData = generateFakeEvolutionData(14, 2, 10)

    const dailyData = data
        .reduce((acc, backup) => {
            const date = backup.createdAt.toISOString().split("T")[0];

            const existing = acc.find(item => item.date === date);

            if (existing) {
                existing.count += 1;
            } else {
                acc.push({date, count: 1});
            }

            return acc;
        }, [] as { date: string; count: number }[]);


    const chartConfig = {
        date: {
            label: "Date",
        },
        count: {
            label: "Number of backups ",
        },
    } satisfies ChartConfig;

    return (

        <LineChartCustom<LineChartDatum>
            config={chartConfig}
            data={dailyData}
            title="Evolution of the number of backups"
            dataKey="count"
        >
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

            <YAxis tickLine={false}/>

            <ChartTooltip
                cursor={{strokeDasharray: "3 3"}}
                content={<EvolutionTooltip/>}
            />

        </LineChartCustom>


    );
}


function EvolutionTooltip({
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
                <span className="text-muted-foreground">Backups :</span>
                <span className="ml-auto font-semibold">
          {data.count}
        </span>
            </div>
        </div>
    );
}
