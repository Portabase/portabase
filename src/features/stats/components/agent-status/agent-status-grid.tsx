"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgentStatusTooltip } from "./agent-status-tooltip";
import { timeAgo } from "@/utils/date-formatting";
import type { AgentWithChecks } from "@/features/stats/types";

type Props = {
  agents: AgentWithChecks[];
};

type AgentStatus = "online" | "degraded" | "offline";

function getAgentStatus(lastContact: Date | null): AgentStatus {
  if (!lastContact) return "offline";
  const minutesAgo = (Date.now() - new Date(lastContact).getTime()) / 60_000;
  if (minutesAgo <= 10) return "online";
  if (minutesAgo <= 30) return "degraded";
  return "offline";
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { dot: string; label: string; border: string; bg: string }
> = {
  online: {
    dot: "bg-green-500",
    label: "En ligne",
    border: "border-l-green-500",
    bg: "hover:bg-green-500/5",
  },
  degraded: {
    dot: "bg-orange-400",
    label: "Dégradé",
    border: "border-l-orange-400",
    bg: "hover:bg-orange-400/5",
  },
  offline: {
    dot: "bg-red-500",
    label: "Hors ligne",
    border: "border-l-red-500",
    bg: "hover:bg-red-500/5",
  },
};

export function AgentStatusGrid({ agents }: Props) {
  const onlineCount = agents.filter(
    (a) => getAgentStatus(a.lastContact) === "online",
  ).length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Agents Status</CardTitle>
          <p className="text-xs text-muted-foreground">
            {onlineCount}/{agents.length} online
          </p>
        </div>
        {/*<Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
          <Link href="/dashboard/agents">Show more</Link>
        </Button>*/}
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Workflow className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No agents registered</p>
            <p className="text-xs text-muted-foreground/60">Register your first agent to monitor it here</p>
          </div>
        ) : agents.length <= 8 ? (
          <TooltipProvider delayDuration={100}>
            <div
              className={cn(
                "grid gap-2",
                agents.length <= 2
                  ? "grid-cols-1"
                  : agents.length <= 6
                    ? "grid-cols-2"
                    : "grid-cols-3",
              )}
            >
              {agents.map((agent) => {
                const status = getAgentStatus(agent.lastContact);
                const config = STATUS_CONFIG[status];
                return (
                  <Tooltip key={agent.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                        )}
                      >
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            config.dot,
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {config.label}
                          </p>
                          {agent.lastContact && (
                            <p className="text-xs text-muted-foreground/60">
                              {timeAgo(agent.lastContact)}
                            </p>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="p-0 border-0 bg-transparent shadow-none"
                    >
                      <AgentStatusTooltip agent={agent} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-1.5">
              {agents.map((agent) => {
                const status = getAgentStatus(agent.lastContact);
                const config = STATUS_CONFIG[status];
                return (
                  <Tooltip key={agent.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-5 w-5 rounded-sm cursor-pointer transition-opacity hover:opacity-70 shrink-0",
                          config.dot,
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="p-0 border-0 bg-transparent shadow-none"
                    >
                      <AgentStatusTooltip agent={agent} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
