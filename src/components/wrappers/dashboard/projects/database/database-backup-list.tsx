"use client"
import {backupColumns} from "@/features/dashboard/backup/columns";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {MoreHorizontal, Trash2} from "lucide-react";
import {FilterItem, FiltersDropdown} from "@/components/wrappers/common/table/filters";
import {DataTable} from "@/components/wrappers/common/table/data-table";
import {useMemo, useState} from "react";
import {Backup, BackupWith, DatabaseWith} from "@/db/schema/07_database";
import {Setting} from "@/db/schema/01_setting";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";
import {deleteBackupAction} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions.action";
import { ButtonWithConfirm } from "@/components/wrappers/common/button/button-with-confirm";


type DatabaseBackupListProps = {
    isAlreadyRestore: boolean;
    settings: Setting;
    database: DatabaseWith;
    backups: BackupWith[];
    activeMember: MemberWithUser
}


export const DatabaseBackupList = (props: DatabaseBackupListProps) => {

    const items = [
        {label: "Deleted", value: "deleted"},
        {label: "Available", value: "available"},
    ]

    const [selectedFilters, setSelectedFilters] = useState<FilterItem[]>([items[1]]);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const queryClient = useQueryClient();

    const columns = useMemo(() => {
        return backupColumns(props.isAlreadyRestore, props.settings, props.database, props.activeMember);
    }, [props.isAlreadyRestore, props.activeMember.id, props.activeMember.role]);

    const filteredBackups = useMemo(() => {
        if (!props.backups) return [];

        return props.backups.filter(backup => {
            if (selectedFilters.length > 0) {
                const selectedValues = selectedFilters.map(f => f.value);
                const status = backup.deletedAt != null ? "deleted" : "available";
                if (!selectedValues.includes(status)) return false;
            }

            return true;
        });
    }, [props.backups, selectedFilters]);


    const handleSelectFilter = (item: FilterItem) => {
        setSelectedFilters(prev =>
            prev.some(f => f.value === item.value)
                ? prev.filter(f => f.value !== item.value)
                : [...prev, item]
        );
    };

    const clearFilters = () => setSelectedFilters([]);


    const mutationDeleteBackups = useMutation({
        mutationFn: async (backups: Backup[]) => {
            const results = await Promise.all(
                backups.map(async (backup) => {
                    if (backup.deletedAt == null) {

                        const backupDeleted = await deleteBackupAction({
                            databaseId: backup.databaseId,
                            backupId: backup.id,
                        })
                        // const backupDeleted = await deleteBackupAction({
                        //     backupId: backup.id,
                        //     databaseId: backup.databaseId,
                        //     status: backup.status,
                        //     file: backup.file ?? "",
                        //     projectSlug: props.database?.project?.slug!
                        // });
                        return {
                            success: backupDeleted?.data?.success,
                            message: backupDeleted?.data?.success
                                ? backupDeleted?.data?.actionSuccess?.message
                                // @ts-ignore
                                : restoration?.data?.actionError.message,
                        };
                    }
                    return {
                        success: true,
                        message: `Already deleted this backup (ref: ${backup.id}).`,
                    }
                })
            );
            results.forEach((result) => {
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error(result.message);
                }
            });
            queryClient.invalidateQueries({queryKey: ["database-data", props.database.id]});
        },
    });

    const isMember = props.activeMember.role === "member";

    return (
        <DataTable
            enableSelect={!isMember}
            columns={columns}
            data={filteredBackups}
            enablePagination
            selectedActions={(rows) => (
                <>
                    <div className="flex justify-start md:justify-between gap-3 md:gap-0 items-center w-full ml-0">
                        <div className="flex gap-2">
                            {!isMember && (
                                <DropdownMenu open={isActionsOpen} onOpenChange={setIsActionsOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <ButtonWithLoading
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsActionsOpen(true);
                                            }}
                                            disabled={rows.length === 0 || mutationDeleteBackups.isPending}
                                            icon={<MoreHorizontal/>}
                                            isPending={mutationDeleteBackups.isPending}
                                            size="sm"
                                            type="button"
                                        >Actions</ButtonWithLoading>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <ButtonWithConfirm 
                                            onConfirm={() => {
                                                const backupsToDelete = rows.map(row => row
                                                ).filter(backup => backup.deletedAt == null)
                                                if (backupsToDelete.length === 0) {
                                                    toast.error("No available backup selected for deletion.");
                                                    return;
                                                }
                                                mutationDeleteBackups.mutate(backupsToDelete);
                                                setIsActionsOpen(false);
                                            }}
                                            onCancel={() => setIsActionsOpen(false)}
                                            title="Delete backups?"
                                            description="Are you sure you want to delete the selected backups? This action cannot be undone."
                                            confirmButtonText="Yes, delete"
                                            cancelButtonText="Cancel"
                                        >
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Trash2 className="me-2 h-4 w-4 text-red-600"/>
                                                <span className="text-red-600">Delete Selected</span>
                                            </DropdownMenuItem>
                                        </ButtonWithConfirm>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            <FiltersDropdown
                                items={items}
                                selectedItems={selectedFilters}
                                onSelect={handleSelectFilter}
                                clearFilters={clearFilters}
                            />
                        </div>
                    </div>

                </>
            )}
        />
    )
}