"use client"
import {DatabaseBackupActionsModal} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions-modal";
import {DatabaseTabs} from "@/components/wrappers/dashboard/projects/database/database-tabs";
import {Setting} from "@/db/schema/01_setting";
import {BackupWith, DatabaseWith, Restoration} from "@/db/schema/07_database";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useBackupModal} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";


export type DatabaseContentProps = {
    settings: Setting,
    backups: BackupWith[],
    restorations: Restoration[],
    isAlreadyRestore: boolean,
    database: DatabaseWith,
    activeMember: MemberWithUser
}


export const DatabaseContent = ({
                                    settings,
                                    backups,
                                    activeMember,
                                    isAlreadyRestore,
                                    restorations,
                                    database
                                }: DatabaseContentProps) => {
    const {} = useBackupModal();

    return (
        <>
            <DatabaseBackupActionsModal/>
            <DatabaseTabs activeMember={activeMember} settings={settings} database={database}
                          isAlreadyRestore={isAlreadyRestore}
                          backups={backups}
                          restorations={restorations}/>
        </>
    )
}