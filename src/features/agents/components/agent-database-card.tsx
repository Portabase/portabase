"use client";

import { Database } from "@/db/schema/07_database";
import { DatabaseCard } from "@/components/common/database-card";
import { DatabaseDeleteButton } from "@/features/agents/components/database-delete-button";

export type AgentDatabaseCardProps = {
    data: Database;
    canDeleteDatabases?: boolean;
    agentLastContact?: Date | string | null;
};

export const AgentDatabaseCard = (props: AgentDatabaseCardProps) => {
    const { data: database, canDeleteDatabases = false, agentLastContact } = props;

    return (
        <DatabaseCard
            withDetails={false}
            data={database}
            deleteButton={
                canDeleteDatabases && database.agentId ? (
                    <DatabaseDeleteButton
                        databaseId={database.id}
                        databaseName={database.name}
                        agentId={database.agentId}
                        agentLastContact={agentLastContact}
                    />
                ) : undefined
            }
        />
    );
};
