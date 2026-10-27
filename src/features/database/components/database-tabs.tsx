"use client";

import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {DatabaseWith} from "@/db/schema/07_database";
import {DatabaseBackupList} from "@/features/database/components/database-backup-list";
import {DatabaseRestoreList} from "@/features/database/components/database-restore-list";
import {MemberWithUser} from "@/db/schema/03_organization";
import {BackupEngine, isReplica} from "@/features/database/utils/backup-method";

export type DatabaseTabsProps = {
    isAlreadyRestore: boolean,
    database: DatabaseWith,
    activeMember: MemberWithUser
};

/** Sources without restoration: key-value stores, and replicas (sync, copy). */
export const isBackupOnly = (database: {dbms: string; backupEngine: BackupEngine}) =>
    database.dbms === "redis" || database.dbms === "valkey" || isReplica(database.backupEngine);

export const DatabaseTabs = (props: DatabaseTabsProps) => {
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<string>(() => searchParams.get("tab") ?? "backup");

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
        const params = new URLSearchParams(window.location.search);
        params.set("tab", value);
        window.history.pushState(null, "", `?${params.toString()}`);
    };

    return (
        <>
            {isBackupOnly(props.database) ?
                <DatabaseBackupList
                    isAlreadyRestore={props.isAlreadyRestore}
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
