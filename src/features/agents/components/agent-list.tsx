"use client";

import {Agent} from "@/db/schema/08_agent";
import {CardsWithPagination} from "@/components/common/cards-with-pagination";
import {AgentCard} from "@/features/agents/components/agent-card";
import {livenessFilter, releaseStateFilter} from "@/components/common/filters/presets";
import {getLiveness} from "@/features/agents/utils/status/agent-status";
import {getReleaseState} from "@/lib/github-releases";
import {useAgentReleases} from "@/features/agents/hooks/use-agent-update-check";
import {useNow} from "@/hooks/use-now";

type AgentListProps = {
    agents: Agent[];
    organizationView?: boolean;
};

export const AgentList = ({agents, organizationView}: AgentListProps) => {
    const {releases} = useAgentReleases();
    const now = useNow();

    const agentRows = agents.map((agent) => ({
        ...agent,
        liveness: getLiveness(agent.lastContact, now),
        releaseState: getReleaseState(agent.version, releases),
    }));

    return (
        <CardsWithPagination
            data={agentRows}
            organizationView={organizationView}
            cardItem={AgentCard}
            cardsPerPage={10}
            pageSizeOptions={[10, 20, 50]}
            numberOfColumns={1}
            filtersConfig={releases ? [livenessFilter, releaseStateFilter] : [livenessFilter]}
            searchKeys={["name"]}
            searchPlaceholder="Search by name"
        />
    );
};
