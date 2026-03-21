"use client";

import {useAction} from "next-safe-action/hooks";
import {toast} from "sonner";
import {useState} from "react";
import {Switch} from "@/components/ui/switch";
import {HealthPingChart} from "./health-ping-chart";
import {toggleHealthDashboardAction} from "./health.action";

type DatabaseHealth = {
    id: string;
    name: string;
    dbms: string;
    lastContact: Date | null;
};

type HealthStatusListProps = {
    databases: DatabaseHealth[];
    failedPings: {databaseId: string; timestamp: Date}[];
    preferences: Record<string, boolean>;
};

export const HealthStatusList = ({
    databases,
    failedPings,
    preferences,
}: HealthStatusListProps) => {
    const [localPrefs, setLocalPrefs] = useState(preferences);

    const {execute} = useAction(toggleHealthDashboardAction, {
        onSuccess: ({data}) => {
            if (data?.success && data.actionSuccess) {
                toast.success(data.actionSuccess.message);
            }
            if (data && !data.success && data.actionError) {
                toast.error(data.actionError.message);
            }
        },
        onError: () => {
            toast.error("Failed to update preference");
        },
    });

    const handleToggle = (databaseId: string, visible: boolean) => {
        setLocalPrefs((prev) => ({...prev, [databaseId]: visible}));
        execute({databaseId, visible});
    };

    if (databases.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>No databases found. Connect an agent and create a project with a database to start monitoring health.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {databases.map((database) => {
                const dbFailures = failedPings
                    .filter((f) => f.databaseId === database.id)
                    .map((f) => ({timestamp: new Date(f.timestamp)}));

                return (
                    <div key={database.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div/>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Pin to dashboard</span>
                                <Switch
                                    checked={localPrefs[database.id] ?? false}
                                    onCheckedChange={(checked) =>
                                        handleToggle(database.id, checked)
                                    }
                                />
                            </div>
                        </div>
                        <HealthPingChart
                            databaseName={database.name}
                            databaseId={database.id}
                            dbms={database.dbms}
                            lastContact={database.lastContact}
                            failedPings={dbFailures}
                        />
                    </div>
                );
            })}
        </div>
    );
};
