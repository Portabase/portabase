"use client";

import {useMemo} from "react";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConnectionIndicator} from "@/components/wrappers/common/connection-indicator";

export type HealthPingChartProps = {
    databaseName: string;
    databaseId: string;
    dbms: string;
    lastContact: Date | null;
    failedPings: {timestamp: Date}[];
    days?: number;
};

type CellData = {
    date: Date;
    dayLabel: string;
    failures: number;
    isFuture: boolean;
};

function buildGrid(days: number, failedPings: {timestamp: Date}[]): CellData[] {
    const now = new Date();
    const cells: CellData[] = [];

    const failuresByDay = new Map<string, number>();
    for (const ping of failedPings) {
        const d = new Date(ping.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        failuresByDay.set(key, (failuresByDay.get(key) || 0) + 1);
    }

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const failures = failuresByDay.get(key) || 0;

        const dayLabel = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });

        cells.push({
            date,
            dayLabel,
            failures,
            isFuture: false,
        });
    }

    return cells;
}

function getCellColor(cell: CellData): string {
    if (cell.isFuture) return "bg-muted";
    if (cell.failures > 0) {
        if (cell.failures >= 10) return "bg-red-600";
        if (cell.failures >= 5) return "bg-red-500";
        return "bg-red-400";
    }
    return "bg-green-500";
}

export const HealthPingChart = ({
    databaseName,
    databaseId,
    dbms,
    lastContact,
    failedPings,
    days = 90,
}: HealthPingChartProps) => {
    const cells = useMemo(() => buildGrid(days, failedPings), [days, failedPings]);

    const weeks: CellData[][] = useMemo(() => {
        const result: CellData[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            result.push(cells.slice(i, i + 7));
        }
        return result;
    }, [cells]);

    const totalFailures = failedPings.length;
    const healthyDays = cells.filter((c) => c.failures === 0 && !c.isFuture).length;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <ConnectionIndicator date={lastContact}/>
                    <div>
                        <CardTitle className="text-sm font-medium">{databaseName}</CardTitle>
                        <p className="text-xs text-muted-foreground uppercase">{dbms}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                        {healthyDays}/{days} healthy days
                    </p>
                    {totalFailures > 0 && (
                        <p className="text-xs text-red-500">{totalFailures} failure(s)</p>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-0.5 overflow-x-auto pb-2">
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-0.5">
                            {week.map((cell, dayIdx) => (
                                <Tooltip key={`${weekIdx}-${dayIdx}`}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "w-3 h-3 rounded-sm cursor-default transition-colors",
                                                getCellColor(cell)
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium">{cell.dayLabel}</p>
                                        <p>
                                            {cell.failures === 0
                                                ? "Healthy"
                                                : `${cell.failures} failure(s)`}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-sm bg-green-500"/>
                        <div className="w-3 h-3 rounded-sm bg-red-400"/>
                        <div className="w-3 h-3 rounded-sm bg-red-500"/>
                        <div className="w-3 h-3 rounded-sm bg-red-600"/>
                    </div>
                    <span>More failures</span>
                </div>
            </CardContent>
        </Card>
    );
};
