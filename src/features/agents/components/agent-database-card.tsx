"use client";

import {Database} from "@/db/schema/07_database";
import {DatabaseCard} from "@/components/common/database-card";
import {DatabaseDeleteButton} from "@/features/agents/components/database-delete-button";

export type agentDatabaseCardProps = {
    data: Database;
};

export const AgentDatabaseCard = (props: agentDatabaseCardProps) => {
    const {data: database} = props;

    return (
        <DatabaseCard
            withDetails={false}
            data={database}
            deleteButton={
                database.agentId ? (
                    <DatabaseDeleteButton databaseId={database.id} agentId={database.agentId}/>
                ) : undefined
            }
        />
    );
};
