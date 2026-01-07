"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Server} from "lucide-react";
import {formatDateLastContact} from "@/utils/date-formatting";
import {AgentCardKey} from "@/components/wrappers/dashboard/agent/agent-card-key/agent-card-key";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {AgentDatabaseCard} from "@/components/wrappers/dashboard/agent/agent-database-card";
import {AgentWithDatabases} from "@/db/schema/08_agent";
import {eventUpdate} from "@/types/events";
import {useAutoRefresh} from "@/hooks/use-auto-refresh";

type AgentContentPageProps = {
    edgeKey: string;
    agent: AgentWithDatabases

}

export const AgentContentPage = ({edgeKey, agent}: AgentContentPageProps) => {

    useAutoRefresh({
        poll: {
            enabled: true,
            intervalMs: 5000,
        },
        sse: {
            enabled: true,
            url: "/api/events",
            eventName: "modification",
            shouldRefresh: (data) => {
                const update = data as eventUpdate;
                return Boolean(update?.update);
            },
        },
    });


    return (
        <>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 ">
                <Card className="w-full sm:w-auto flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Databases</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agent.databases.length}</div>
                        <p className="text-xs text-muted-foreground">Databases linked to this agent</p>
                    </CardContent>
                </Card>

                <Card className="w-full sm:w-auto flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last contact</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDateLastContact(agent.lastContact)}</div>
                        <p className="text-xs text-muted-foreground">Last contact with agent</p>
                    </CardContent>
                </Card>

            </div>
            <Card className="w-full sm:w-auto flex-1 ">
                <CardHeader className="font-bold text-xl">
                    Edge Key
                </CardHeader>
                <CardContent>
                    <AgentCardKey
                        edgeKey={edgeKey}
                    />
                </CardContent>
            </Card>
            <CardsWithPagination cardsPerPage={4} numberOfColumns={2} data={agent.databases}
                                 cardItem={AgentDatabaseCard}/>

        </>
    )
}