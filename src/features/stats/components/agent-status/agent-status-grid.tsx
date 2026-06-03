"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AgentStatusTooltip } from "./agent-status-tooltip"
import type { AgentWithChecks } from "@/features/stats/types"

type Props = {
  agents: AgentWithChecks[]
}

function getAgentColor(lastContact: Date | null): string {
  if (!lastContact) return "bg-red-500"
  const minutesAgo = (Date.now() - new Date(lastContact).getTime()) / 60_000
  if (minutesAgo <= 10) return "bg-green-500"
  if (minutesAgo <= 30) return "bg-orange-400"
  return "bg-red-500"
}

function getSquareSize(count: number): number {
  if (count <= 10) return 24
  if (count <= 30) return 16
  if (count <= 100) return 10
  return 6
}

export function AgentStatusGrid({ agents }: Props) {
  const size = getSquareSize(agents.length)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">État des agents</CardTitle>
        <p className="text-xs text-muted-foreground">
          {agents.filter((a) => getAgentColor(a.lastContact) === "bg-green-500").length}/{agents.length} en ligne
        </p>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun agent</p>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div
              className="flex flex-wrap gap-1"
              style={{ gap: size <= 10 ? "2px" : "4px" }}
            >
              {agents.map((agent) => (
                <Tooltip key={agent.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-sm cursor-pointer transition-opacity hover:opacity-80",
                        getAgentColor(agent.lastContact)
                      )}
                      style={{ width: size, height: size }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-0 border-0 shadow-none">
                    <AgentStatusTooltip agent={agent} />
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
