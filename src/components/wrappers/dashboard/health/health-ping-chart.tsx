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
    isToday: boolean;
};

function buildGrid(pastDays: number, futureDays: number, failedPings: {timestamp: Date}[]): CellData[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cells: CellData[] = [];

    const failuresByDay = new Map<string, number>();
    for (const ping of failedPings) {
        const d = new Date(ping.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        failuresByDay.set(key, (failuresByDay.get(key) || 0) + 1);
    }

    for (let i = pastDays; i >= -futureDays; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const isToday = i === 0;
        const isFuture = i < 0;
        const failures = isFuture ? 0 : (failuresByDay.get(key) || 0);

        const dayLabel = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });

        cells.push({date, dayLabel, failures, isFuture, isToday});
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
    const cells = useMemo(() => buildGrid(days, days, failedPings), [days, failedPings]);

    const weeks: (CellData | null)[][] = useMemo(() => {
        const result: (CellData | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            const week: (CellData | null)[] = cells.slice(i, i + 7);
            while (week.length < 7) {
                week.push(null);
            }
            result.push(week);
        }
        return result;
    }, [cells]);

    const pastCells = cells.filter((c) => !c.isFuture);
    const totalFailures = failedPings.length;
    const healthyDays = pastCells.filter((c) => c.failures === 0).length;

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
                        {healthyDays}/{pastCells.length} healthy days
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
                                cell === null ? (
                                    <div
                                        key={`${weekIdx}-${dayIdx}`}
                                        className="w-3 h-3 rounded-full bg-muted"
                                    />
                                ) : cell.isFuture ? (
                                    <Tooltip key={`${weekIdx}-${dayIdx}`}>
                                        <TooltipTrigger asChild>
                                            <div className="w-3 h-3 rounded-full bg-muted cursor-default"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-medium">{cell.dayLabel}</p>
                                            <p>Forecast</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip key={`${weekIdx}-${dayIdx}`}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={cn(
                                                    "w-3 h-3 rounded-full cursor-default transition-colors",
                                                    getCellColor(cell),
                                                    cell.isToday && "ring-2 ring-foreground/50"
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="font-medium">
                                                {cell.dayLabel}
                                                {cell.isToday && " (Today)"}
                                            </p>
                                            <p>
                                                {cell.failures === 0
                                                    ? "Healthy"
                                                    : `${cell.failures} failure(s)`}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            ))}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"/>
                        <div className="w-3 h-3 rounded-full bg-red-400"/>
                        <div className="w-3 h-3 rounded-full bg-red-500"/>
                        <div className="w-3 h-3 rounded-full bg-red-600"/>
                    </div>
                    <span>More</span>
                    <span className="ml-2">|</span>
                    <div className="w-3 h-3 rounded-full bg-muted"/>
                    <span>Forecast</span>
                </div>
            </CardContent>
        </Card>
    );
};
