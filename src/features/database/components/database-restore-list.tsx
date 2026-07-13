"use client"
import {DataTable} from "@/components/common/data-table";
import {restoreColumns} from "@/features/database/components/restore-columns";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ButtonWithLoading} from "@/components/common/button-with-loading";
import {MoreHorizontal, Trash2} from "lucide-react";
import {Restoration, RestorationWith} from "@/db/schema/07_database";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRestoreAction} from "@/features/database/actions/restore.action";
import {toast} from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useMemo, useState} from "react";
import {ButtonWithConfirm} from "@/components/common/button-with-confirm";
import {useServerDataTable} from "@/hooks/use-server-data-table";
import {fetchRestorationsAction} from "@/features/database/actions/backup-list.action";
import type {FetchRestorationsSchema} from "@/features/database/actions/backup-list.schema";

type DatabaseRestoreListProps = {
    isAlreadyRestore: boolean;
    activeMember: MemberWithUser;
    databaseId: string;
}

export const DatabaseRestoreList = (props: DatabaseRestoreListProps) => {
    const queryClient = useQueryClient();
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const columns = useMemo(() => {
        return restoreColumns(props.isAlreadyRestore, props.activeMember);
    }, [props.isAlreadyRestore, props.activeMember.id, props.activeMember.role]);

    const {data, tableProps, isFetching, isLoading} = useServerDataTable<RestorationWith, FetchRestorationsSchema>({
        fetchAction: fetchRestorationsAction,
        queryKey: ["restorations", props.databaseId],
        extraParams: {databaseId: props.databaseId},
        initialPageSize: 20,
        refetchInterval: 4000,
    });

    const mutationDeleteRestorations = useMutation({
        mutationFn: async (restorations: Restoration[]) => {
            const results = await Promise.all(
                restorations.map(async (restoration) => {
                    const restorationDeleted = await deleteRestoreAction({
                        restorationId: restoration.id,
                    });
                    return {
                        success: restorationDeleted?.data?.success,
                        message: restorationDeleted?.data?.success
                            ? restorationDeleted?.data?.actionSuccess?.message
                            // @ts-ignore
                            : restorationDeleted?.data?.actionError.message,
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
            queryClient.invalidateQueries({queryKey: ["restorations", props.databaseId]});
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
            {...tableProps}
            selectedActions={(rows) => (
                <>
                    {!isMember && (
                        <DropdownMenu open={isActionsOpen} onOpenChange={setIsActionsOpen}>
                            <DropdownMenuTrigger asChild>
                                <ButtonWithLoading
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsActionsOpen(true);
                                    }}
                                    disabled={rows.length === 0 || mutationDeleteRestorations.isPending}
                                    icon={<MoreHorizontal/>}
                                    isPending={mutationDeleteRestorations.isPending}
                                    size="sm"
                                    type="button"
                                >Actions</ButtonWithLoading>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <ButtonWithConfirm
                                    onConfirm={() => {
                                        mutationDeleteRestorations.mutate(rows)
                                        setIsActionsOpen(false);
                                    }}
                                    onCancel={() => setIsActionsOpen(false)}
                                    title="Delete restorations?"
                                    description="Are you sure you want to delete the selected restorations? This action cannot be undone."
                                    confirmButtonText="Yes, delete"
                                    cancelButtonText="Cancel"
                                >
                                    <DropdownMenuItem
                                        disabled={props.isAlreadyRestore}
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-red-600 focus:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2"/>
                                        Delete Selected
                                    </DropdownMenuItem>
                                </ButtonWithConfirm>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </>
            )}
        />
    );
};
