"use client"
import {backupColumns} from "@/features/database/components/backup-columns";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ButtonWithLoading} from "@/components/common/button-with-loading";
import {MoreHorizontal, Trash2} from "lucide-react";
import {DataTable} from "@/components/common/data-table";
import {useMemo, useState} from "react";
import {Backup, BackupWith, DatabaseWith} from "@/db/schema/07_database";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";
import {deleteBackupAction} from "@/features/database/actions/backup-actions.action";
import {ButtonWithConfirm} from "@/components/common/button-with-confirm";
import {useServerDataTable} from "@/hooks/use-server-data-table";
import {fetchBackupsAction} from "@/features/database/actions/backup-list.action";
import type {FetchBackupsSchema} from "@/features/database/actions/backup-list.schema";
import type {GenericFilter, GenericFilterConfig} from "@/components/common/filters/types";
import {FiltersWrapper} from "@/components/common/filters/filters-wrapper";
import {useListFilters} from "@/hooks/use-list-filters";
import {jobStatusFilter} from "@/components/common/filters/presets";

const backupFiltersConfig: GenericFilterConfig[] = [
    {
        type: "state",
        label: "State",
        options: [
            {value: "available", label: "Available"},
            {value: "deleted", label: "Deleted"},
        ],
    },
    jobStatusFilter,
];

const defaultBackupFilters: GenericFilter[] = [{type: "state", operator: "is", value: ["available"]}];

type DatabaseBackupListProps = {
    isAlreadyRestore: boolean;
    database: DatabaseWith;
    activeMember: MemberWithUser;
}

export const DatabaseBackupList = (props: DatabaseBackupListProps) => {
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const queryClient = useQueryClient();

    const columns = useMemo(() => {
        return backupColumns(props.isAlreadyRestore, props.database, props.activeMember);
    }, [props.isAlreadyRestore, props.activeMember.id, props.activeMember.role]);

    const {filtersProps, params} = useListFilters({
        filtersConfig: backupFiltersConfig,
        searchKeys: [],
        defaultFilters: defaultBackupFilters,
    });

    const {data, tableProps, isFetching, isLoading} = useServerDataTable<BackupWith, FetchBackupsSchema>({
        fetchAction: fetchBackupsAction,
        queryKey: ["backups", props.database.id],
        extraParams: {databaseId: props.database.id, ...params} as Partial<FetchBackupsSchema>,
        initialPageSize: 20,
        refetchInterval: 4000,
    });

    const mutationDeleteBackups = useMutation({
        mutationFn: async (backups: Backup[]) => {
            const results = await Promise.all(
                backups.map(async (backup) => {
                    if (backup.deletedAt == null || backup.status == "ongoing") {
                        const backupDeleted = await deleteBackupAction({
                            databaseId: backup.databaseId,
                            backupId: backup.id,
                        });
                        const inner = backupDeleted?.data;
                        return {
                            success: inner?.success,
                            message: inner?.success
                                ? inner.actionSuccess?.message
                                : inner?.actionError?.message ?? "Failed to delete backup.",
                        };
                    }
                    return {
                        success: true,
                        message: `Already deleted this backup (ref: ${backup.id}).`,
                    };
                })
            );
            results.forEach((result) => {
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error(result.message);
                }
            });
            queryClient.invalidateQueries({queryKey: ["backups", props.database.id]});
        },
    });

    const isMember = props.activeMember.role === "member";

    return (
        <DataTable
            enableSelect={!isMember}
            columns={columns}
            data={data}
            enablePagination
            isFetching={isFetching || isLoading}
            isFiltered={filtersProps.filters.length > 0}
            {...tableProps}
            selectedActions={(rows) => (
                <>
                    <div className="flex justify-start md:justify-between gap-3 md:gap-0 items-center w-full ml-0">
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
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
                                            type="button"
                                        >Actions</ButtonWithLoading>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <ButtonWithConfirm
                                            onConfirm={() => {
                                                mutationDeleteBackups.mutate(rows);
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
                            <FiltersWrapper {...filtersProps}/>
                        </div>
                    </div>
                </>
            )}
        />
    );
};
