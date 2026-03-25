"use client"

import {useMemo} from "react"
import {Card} from "@/components/ui/card"
import {HealthcheckLog} from "@/db/schema/15_healthcheck-log"
import {useIsMobile} from "@/hooks/use-mobile";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown"

interface HealthCheckData {
    timestamp: Date
    status: HealthStatus
}

interface Props {
    logs: HealthcheckLog[]
}

const INTERVAL_MINUTES = 10
const WINDOW_HOURS = 12

function roundDateToInterval(date: Date, intervalMinutes: number): Date {
    const ms = intervalMinutes * 60 * 1000
    return new Date(Math.floor(date.getTime() / ms) * ms)
}

function buildTimeSeries(logs: HealthcheckLog[]): HealthCheckData[] {
    const intervalMs = INTERVAL_MINUTES * 60 * 1000
    const now = new Date()
    const roundedNow = roundDateToInterval(now, INTERVAL_MINUTES)

    const buckets = (WINDOW_HOURS * 60) / INTERVAL_MINUTES
    const data: HealthCheckData[] = []
    const oldestLog = logs.length > 0 ? getOldestLog(logs) : null
    for (let i = buckets - 1; i >= 0; i--) {
        const start = new Date(roundedNow.getTime() - i * intervalMs)
        const end = new Date(start.getTime() + intervalMs)

        const bucketLogs = logs.filter(
            (l) =>
                l.date &&
                new Date(l.date) >= start &&
                new Date(l.date) < end
        )

        let status: HealthStatus = "unknown"

        if (!oldestLog || new Date(oldestLog.date!) > start) {
            status = "unknown"
        } else if (new Date(oldestLog.date!) < start) {
            status = "down"
        }

        if (bucketLogs.length > 0) {
            const hasFailure = bucketLogs.some((l) => l.status === "failed")
            const hasSuccess = bucketLogs.some((l) => l.status === "success")

            if (hasFailure && hasSuccess) {
                status = "degraded"
            } else if (hasFailure) {
                status = "down"
            } else if (hasSuccess) {
                status = "healthy"
            }
        }

        data.push({timestamp: start, status})
    }

    return data
}

function getStatusColor(status: HealthStatus): string {
    switch (status) {
        case "healthy":
            return "bg-emerald-500"
        case "degraded":
            return "bg-emerald-700"
        case "down":
            return "bg-red-500"
        case "unknown":
            return "bg-zinc-700"
    }
}

function getOldestLog(logs: HealthcheckLog[]): HealthcheckLog {
    console.log(logs)
    const validLogs = logs.filter(l => l.date)

    return validLogs.reduce((oldest, current) =>
        new Date(current.date!) < new Date(oldest.date!) ? current : oldest
    )
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
}


export const HealthCheckGraph = ({logs}: Props) => {
    const data = useMemo(() => {
        return buildTimeSeries(logs)
    }, [logs])

    const isMobile = useIsMobile()


    const hourLabels = useMemo(() => {
        if (data.length === 0) return []


        return data
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => {
                const hours = item.timestamp.getHours()
                const minutes = item.timestamp.getMinutes()
                if (isMobile) {
                    return minutes === 0 && hours % 3 === 0
                } else {
                    return minutes === 0
                }
            })
            .map(({ item, index }) => ({
                hour: formatTime(item.timestamp),
                index,
            }))
    }, [data])

    const healthyCount = data.filter((d) => d.status === "healthy").length

    const uptimePercent =
        data.length > 0
            ? ((healthyCount / data.length) * 100).toFixed(1)
            : "0.0"

    return (
        <div className="flex items-center justify-center">
            <div className="w-full">
                <Card className="h-full flex flex-col p-4 border-border/50 bg-card gap-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Health</h2>
                            <p className="text-zinc-500 text-sm">
                                Last 12 hours • {INTERVAL_MINUTES} minute intervals
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-400 text-2xl font-bold">
                                {uptimePercent}%
                            </p>
                            <p className="text-zinc-500 text-sm">Uptime</p>
                        </div>
                    </div>


                    <div className="relative mb-1 h-4 text-xs text-zinc-500">
                        {hourLabels.map((label, i) => {
                            const left = (label.index / (data.length - 1)) * 100

                            return (
                                <div
                                    key={i}
                                    className="absolute -translate-x-1/2 whitespace-nowrap"
                                    style={{ left: `${left}%` }}
                                >
                                    {label.hour}
                                </div>
                            )
                        })}
                    </div>


                    <div className="flex gap-0.5">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className={`flex-1 h-8 rounded-sm ${getStatusColor(item.status)} hover:ring-2 hover:ring-zinc-400 transition-all cursor-pointer`}
                                title={`${formatTime(item.timestamp)} - ${item.status}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-4 mt-4 text-xs text-zinc-500">
                        <Legend color="bg-zinc-700" label="Unknown"/>
                        <Legend color="bg-red-500" label="Down"/>
                        <Legend color="bg-emerald-700" label="Degraded"/>
                        <Legend color="bg-emerald-500" label="Healthy"/>
                    </div>
                </Card>
            </div>
        </div>
    )
}

const Legend = ({color, label}: { color: string; label: string }) => (
    <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-sm ${color}`}/>
        <span>{label}</span>
    </div>
)