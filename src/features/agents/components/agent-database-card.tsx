"use client";

import { Database } from "@/db/schema/07_database";
import { DatabaseCard } from "@/components/common/database-card";
import { DatabaseDeleteButton } from "@/features/agents/components/database-delete-button";

export type AgentDatabaseCardProps = {
    data: Database;
    canDeleteDatabases?: boolean;
};

export const AgentDatabaseCard = (props: AgentDatabaseCardProps) => {
    const { data: database, canDeleteDatabases = false } = props;

    return (
        <DatabaseCard
            withDetails={false}
            data={database}
            deleteButton={
                canDeleteDatabases && database.agentId ? (
                    <DatabaseDeleteButton
                        databaseId={database.id}
                        agentId={database.agentId}
                    />
                ) : undefined
            }
        />
    );
};