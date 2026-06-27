import {ChartConfig, ChartContainer} from "@/components/ui/chart";
import {Line, LineChart} from "recharts";
import {ReactNode, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {PlaceholderChart} from "@/features/statistics/components/chart-placeholder";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

type LineChartCustomProps<T> = {
    config: ChartConfig,
    data: T[],
    children: ReactNode,
    title: string,
    dataKey: string,
    margin?: { left: number; right: number }
}


export const LineChartCustom = <T extends { date: string }>({
                                                                config,
                                                                title,
                                                                data,
                                                                children,
                                                                dataKey,
                                                                margin
                                                            }: LineChartCustomProps<T>) => {


    const [timeRange, setTimeRange] = useState("7d")
    const filteredData = data.filter((item) => {
        const date = new Date(item.date)
        const referenceDate = new Date()
        let daysToSubtract = 90
        if (timeRange === "30d") {
            daysToSubtract = 30
        } else if (timeRange === "7d") {
            daysToSubtract = 7
        }
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
    })


    return (
        <Card className="w-full">
            <CardHeader className="flex items-center gap-4 space-y-0 border-b py-0 sm:flex-row">
                <CardTitle className="text-sm md:text-lg">{title}</CardTitle>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className=" rounded-lg sm:ml-auto sm:flex"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months"/>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                    </SelectContent>
                </Select>

            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 md:pt-0 md:px-6 h-full w-full">

                {data.length > 0 ? (
                    <ChartContainer config={config}>
                        <LineChart
                            accessibilityLayer
                            data={filteredData}
                            margin={margin ? margin : {
                                left: -35,
                                right: 12,
                            }}
                        >
                            {children}

                            <Line
                                dataKey={dataKey}
                                type="linear"
                                strokeWidth={2}
                                stroke="#fc6504"
                                dot={false}
                            />
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <PlaceholderChart text="No data available"/>
                )}
            </CardContent>
        </Card>
    )
}
