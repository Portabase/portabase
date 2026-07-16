"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { InfoTooltip } from "@/features/stats/components/info-tooltip";
import { AgentStatusInfo } from "./agent-status.info";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AgentStatusTooltip } from "./agent-status-tooltip";
import type { AgentLinkAccess, AgentWithChecks } from "@/features/stats/types";
import {
  DASHBOARD_THRESHOLDS,
  getAgentStatus,
  type AgentStatus,
} from "@/features/agents/utils/status/agent-status";

type Props = {
  agents: AgentWithChecks[];
  access?: AgentLinkAccess;
};

const STATUS_CONFIG: Record<
  AgentStatus,
  { dot: string; label: string; border: string; bg: string }
> = {
  online: {
    dot: "bg-emerald-500",
    label: "Online",
    border: "border-l-emerald-500",
    bg: "hover:bg-emerald-500/5",
  },
  degraded: {
    dot: "bg-emerald-700",
    label: "Dégradé",
    border: "border-l-emerald-700",
    bg: "hover:bg-emerald-700/5",
  },
  offline: {
    dot: "bg-red-500",
    label: "Offline",
    border: "border-l-red-500",
    bg: "hover:bg-red-500/5",
  },
};

export function AgentStatusGrid({ agents, access }: Props) {
  const isMobile = useIsMobile();

  const onlineCount = agents.filter(
    (a) => getAgentStatus(a.lastContact, DASHBOARD_THRESHOLDS) === "online",
  ).length;

  const columnCount = Math.max(1, Math.ceil(Math.sqrt(agents.length)));
  const rowCount = Math.ceil(agents.length / columnCount);
  const trailingSpan = columnCount * rowCount - agents.length + 1;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">Agents Status</CardTitle>
            <InfoTooltip content={<AgentStatusInfo />} />
          </div>
          <p className="text-xs text-muted-foreground">
            {onlineCount}/{agents.length} online
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Workflow className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No agents registered
            </p>
            <p className="text-xs text-muted-foreground/60">
              Register your first agent to monitor it here
            </p>
          </div>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div
              className="grid gap-1.5 h-55"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                gridAutoRows: "minmax(0, 1fr)",
              }}
            >
              {agents.map((agent, index) => {
                const status = getAgentStatus(agent.lastContact, DASHBOARD_THRESHOLDS);
                const config = STATUS_CONFIG[status];
                const isLast = index === agents.length - 1;

                const tile = (
                  <button
                    type="button"
                    aria-label={`${agent.name} — ${config.label}`}
                    className={cn(
                      "h-full w-full rounded-md cursor-pointer transition-opacity hover:opacity-70",
                      config.dot,
                    )}
                    style={
                      isLast && trailingSpan > 1
                        ? { gridColumn: `span ${trailingSpan}` }
                        : undefined
                    }
                  />
                );

                if (isMobile) {
                  return (
                    <Popover key={agent.id}>
                      <PopoverTrigger asChild>{tile}</PopoverTrigger>
                      <PopoverContent
                        side="top"
                        className="p-0 border-0 bg-transparent shadow-none w-auto"
                      >
                        <AgentStatusTooltip agent={agent} access={access} />
                      </PopoverContent>
                    </Popover>
                  );
                }

                return (
                  <Tooltip key={agent.id}>
                    <TooltipTrigger asChild>{tile}</TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="p-0 border-0 bg-transparent shadow-none"
                    >
                      <AgentStatusTooltip agent={agent} access={access} />
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
