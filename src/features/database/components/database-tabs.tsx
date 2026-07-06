"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {DatabaseWith} from "@/db/schema/07_database";
import {Setting} from "@/db/schema/01_setting";
import {DatabaseBackupList} from "@/features/database/components/database-backup-list";
import {DatabaseRestoreList} from "@/features/database/components/database-restore-list";
import {MemberWithUser} from "@/db/schema/03_organization";

export type DatabaseTabsProps = {
    settings: Setting,
    isAlreadyRestore: boolean,
    database: DatabaseWith,
    activeMember: MemberWithUser
};

export const backupOnly = ["redis", "valkey"];

export const DatabaseTabs = (props: DatabaseTabsProps) => {
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<string>(() => searchParams.get("tab") ?? "backup");

    // Keep local tab state in sync with browser back/forward navigation.
    useEffect(() => {
        const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            setTab(params.get("tab") ?? "backup");
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const handleChangeTab = (value: string) => {
        setTab(value);
        // Update the URL without a server round-trip (no router.push re-render).
        const params = new URLSearchParams(window.location.search);
        params.set("tab", value);
        window.history.pushState(null, "", `?${params.toString()}`);
    };

    const isBackupOnly = backupOnly.some((type) => props.database.dbms === type);

    return (
        <>
            {isBackupOnly ?
                <DatabaseBackupList
                    isAlreadyRestore={props.isAlreadyRestore}
                    settings={props.settings}
                    database={props.database}
                    activeMember={props.activeMember}
                />
                :
                <Tabs className="flex flex-col flex-1" value={tab} onValueChange={handleChangeTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="backup">Backup</TabsTrigger>
                        <TabsTrigger value="restore">Restoration</TabsTrigger>
                    </TabsList>
                    <TabsContent className="h-full justify-between" value="backup">
                        <DatabaseBackupList
                            isAlreadyRestore={props.isAlreadyRestore}
                            settings={props.settings}
                            database={props.database}
                            activeMember={props.activeMember}
                        />
                    </TabsContent>
                    <TabsContent className="h-full justify-between" value="restore">
                        <DatabaseRestoreList
                            isAlreadyRestore={props.isAlreadyRestore}
                            activeMember={props.activeMember}
                            databaseId={props.database.id}
                        />
                    </TabsContent>
                </Tabs>
            }
        </>
    );
};
