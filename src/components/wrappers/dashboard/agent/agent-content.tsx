"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Server} from "lucide-react";
import {formatDateLastContact} from "@/utils/date-formatting";
import {AgentCardKey} from "@/components/wrappers/dashboard/agent/agent-card-key/agent-card-key";
import {AgentWithDatabases} from "@/db/schema/08_agent";
import {useQuery} from "@tanstack/react-query";
import {getAgentAction} from "@/features/agents/agents.action";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {AgentDatabaseCard} from "@/components/wrappers/dashboard/agent/agent-database-card";

type AgentContentPageProps = {
    edgeKey: string;
    agent: AgentWithDatabases
}

export const AgentContentPage = ({edgeKey, agent: initialAgent}: AgentContentPageProps) => {

    const {data} = useQuery({
        queryKey: ["agent-data", initialAgent.id],
        queryFn: async () => {
            const result = await getAgentAction(initialAgent.id);
            return result?.data;
        },
        initialData: {
            data: initialAgent
        },
        staleTime: 0,
        gcTime: 0,
        refetchInterval: 5000,
    });

    const agent = data?.data ?? initialAgent;

    return (
        <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 ">
                <Card className="w-full sm:w-auto flex-1 border-none shadow-none bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Databases</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground opacity-50"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{agent.databases.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Linked resources</p>
                    </CardContent>
                </Card>

                <Card className="w-full sm:w-auto flex-1 border-none shadow-none bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Last contact</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground opacity-50"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{formatDateLastContact(agent.lastContact)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Status heartbeat</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Accordion type="single" collapsible defaultValue={!agent.lastContact ? "registration" : undefined}>
                    <AccordionItem value="registration" className="border rounded-xl px-6 bg-card shadow-sm overflow-hidden transition-all duration-300 data-[state=open]:ring-1 data-[state=open]:ring-primary/20">
                        <AccordionTrigger className="hover:no-underline py-4 group">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold tracking-tight">Registration & Setup</span>
                                {!agent.lastContact && (
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse">
                                        Action Required
                                    </Badge>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 border-t border-dashed">
                            <AgentCardKey
                                edgeKey={edgeKey}
                                agentName={agent.name}
                            />
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
                </div>
                <Separator className="opacity-50" />
                <CardsWithPagination
                    cardsPerPage={4}
                    numberOfColumns={2}
                    data={agent.databases}
                    cardItem={AgentDatabaseCard}
                />
            </div>
        </div>
    )
}