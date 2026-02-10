"use client"
import {DataTable} from "@/components/wrappers/common/table/data-table";
import {restoreColumns} from "@/features/dashboard/restore/columns";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {MoreHorizontal, Trash2} from "lucide-react";
import {Restoration} from "@/db/schema/07_database";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRestoreAction} from "@/features/dashboard/restore/restore.action";
import {toast} from "sonner";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useMemo, useState} from "react";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";


type DatabaseRestoreListProps = {
    isAlreadyRestore: boolean;
    restorations: Restoration[];
    activeMember: MemberWithUser;
    databaseId: string;
}

export const DatabaseRestoreList = (props: DatabaseRestoreListProps) => {
    const queryClient = useQueryClient();
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const columns = useMemo(() => {
        return restoreColumns(props.isAlreadyRestore, props.activeMember);
    }, [props.isAlreadyRestore, props.activeMember.id, props.activeMember.role]);

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
            queryClient.invalidateQueries({queryKey: ["database-data", props.databaseId]});
        },
    });
    const isMember = props.activeMember.role === "member";


    return (
        <DataTable
            enableSelect={!isMember}
            columns={columns}
            data={props.restorations}
            enablePagination
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
    )
}