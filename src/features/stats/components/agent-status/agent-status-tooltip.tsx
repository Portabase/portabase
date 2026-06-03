"use client"

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts"
import type { AgentWithChecks } from "@/features/stats/types"

type Props = {
  agent: AgentWithChecks
}

type Bucket = {
  label: string
  status: "success" | "failed" | "unknown"
}

function buildBuckets(checks: AgentWithChecks["recentChecks"]): Bucket[] {
  const now = new Date()
  const buckets: Bucket[] = []

  for (let i = 23; i >= 0; i--) {
    const bucketEnd = new Date(now.getTime() - i * 30 * 60 * 1000)
    const bucketStart = new Date(bucketEnd.getTime() - 30 * 60 * 1000)
    const label = `${String(bucketStart.getHours()).padStart(2, "0")}h${String(bucketStart.getMinutes()).padStart(2, "0")}`

    const bucketChecks = checks.filter((c) => {
      const t = new Date(c.date).getTime()
      return t >= bucketStart.getTime() && t < bucketEnd.getTime()
    })

    let status: Bucket["status"] = "unknown"
    if (bucketChecks.length > 0) {
      status = bucketChecks.some((c) => c.status === "success") ? "success" : "failed"
    }

    buckets.push({ label, status })
  }

  return buckets
}

const BUCKET_COLORS = {
  success: "#22c55e",
  failed: "#ef4444",
  unknown: "#e5e7eb",
}

export function AgentStatusTooltip({ agent }: Props) {
  const buckets = buildBuckets(agent.recentChecks)

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md w-56">
      <p className="text-xs font-semibold mb-2 truncate">{agent.name}</p>
      <p className="text-xs text-muted-foreground mb-2">Activité — 12 dernières heures</p>
      <ResponsiveContainer width="100%" height={40}>
        <BarChart data={buckets} barSize={6} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <XAxis dataKey="label" hide />
          <Bar dataKey={() => 1} radius={2}>
            {buckets.map((b, i) => (
              <Cell key={i} fill={BUCKET_COLORS[b.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>-12h</span>
        <span>-6h</span>
        <span>maintenant</span>
      </div>
    </div>
  )
}
