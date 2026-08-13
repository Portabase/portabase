"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Server} from "lucide-react";
import {formatDateLastContact} from "@/utils/date-formatting";
import {AgentCardKey} from "@/features/agents/components/agent-card-key";
import {AgentWithDatabases} from "@/db/schema/08_agent";
import {useQuery} from "@tanstack/react-query";
import {getAgentAction} from "@/features/agents/actions/agents.action";
import {AgentOverrideUrlForm} from "@/features/agents/components/agent-override-url-form";
import {generateEdgeKey} from "@/utils/edge_key";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {CardsWithPagination} from "@/components/common/cards-with-pagination";
import {AgentDatabaseCard} from "@/features/agents/components/agent-database-card";
import {HealthCheckGraph} from "@/features/database/components/health-grid";
import {HealthcheckLog} from "@/db/schema/15_healthcheck-log";
import { DatabaseConfigModal } from "@/features/database/components/database-config-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type AgentContentPageProps = {
    edgeKey: string;
    agent: AgentWithDatabases
    canDeleteDatabases?: boolean
}

export const AgentContentPage = ({edgeKey, agent: initialAgent, canDeleteDatabases = false}: AgentContentPageProps) => {

    const {data} = useQuery({
        queryKey: ["agent-data", initialAgent.id],
        queryFn: async () => {
            const result = await getAgentAction(initialAgent.id);
            return result?.data;
        },
        initialData: {
            data: initialAgent,
            health: []
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 1000,
    });

    const agent = data?.data ?? initialAgent;
    const agentHealthLogs: HealthcheckLog[] = data?.health ?? [];

    const { data: edgeKeyValue } = useQuery({
        queryKey: ["edge-key", agent.id, agent.overrideUrl],
        queryFn: () =>
            agent.overrideUrl
                ? generateEdgeKey(agent.overrideUrl, agent.id)
                : Promise.resolve(edgeKey),
        initialData: edgeKey,
    });

    return (
        <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 ">
                <Card className="w-full sm:w-auto flex-1  transition-all  border-border/50 bg-card ">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle
                            className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Databases</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground opacity-50"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{agent.databases.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Linked resources</p>
                    </CardContent>
                </Card>

                <Card className="w-full sm:w-auto flex-1  transition-all  border-border/50 bg-card ">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Last
                            contact</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground opacity-50"/>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="text-3xl font-bold tracking-tight">{formatDateLastContact(agent.lastContact)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Status heartbeat</p>
                    </CardContent>
                </Card>
            </div>

            {agent.lastContact && (
                <HealthCheckGraph logs={agentHealthLogs}/>
            )}

            <div className="space-y-6">
                <Accordion type="single" collapsible defaultValue={!agent.lastContact ? "registration" : undefined}>
                    <AccordionItem value="registration"
                                   className="border rounded-xl px-6 bg-card shadow-sm overflow-hidden transition-all duration-300">
                        <AccordionTrigger className="hover:no-underline py-4 group">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold tracking-tight">Registration & Setup</span>
                                {!agent.lastContact && (
                                    <Badge variant="outline"
                                           className="bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 border-t border-dashed">
                            <div className="flex flex-col gap-4">
                                <AgentOverrideUrlForm agent={agent} />
                                <AgentCardKey
                                    edgeKey={edgeKeyValue}
                                    agentName={agent.name}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Managed Databases</h2>
                        <p className="text-sm text-muted-foreground">
                            Resources currently connected to this agent.
                        </p>
                    </div>
                    <DatabaseConfigModal
                        agentId={agent.id}
                        trigger={
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add database
                            </Button>
                        }
                    />
                </div>
                <Separator className="opacity-50"/>
                {agent.databases.length > 0 ? (
                    <CardsWithPagination
                        cardsPerPage={4}
                        numberOfColumns={2}
                        data={[...agent.databases].sort((a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )}
                        cardItem={AgentDatabaseCard}
                        canDeleteDatabases={canDeleteDatabases}
                        agentLastContact={agent.lastContact}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground px-1">No databases yet. Add one to push its config to the agent.</p>
                )}
            </div>
        </div>
    )
}