"use client";

import {useState} from "react";
import {Trash2} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {deleteDatabaseAction} from "@/features/database/actions/database-delete.action";
import {DatabaseDeleteDialog} from "@/features/agents/components/database-delete-dialog";
import {isAgentOnline} from "@/features/agents/utils/status/agent-status";

export type DatabaseDeleteButtonProps = {
    databaseId: string;
    databaseName: string;
    agentId: string;
    agentLastContact?: Date | string | null;
};

export const DatabaseDeleteButton = (props: DatabaseDeleteButtonProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const online = isAgentOnline(props.agentLastContact);

    const mutation = useMutation({
        mutationFn: () => deleteDatabaseAction({databaseId: props.databaseId}),
        onSuccess: async (result: any) => {
            if (result.data?.success) {
                toast.success(result.data.actionSuccess.message);

                const failedBackupCount = result.data.actionSuccess?.messageParams?.failedBackupCount ?? 0;
                if (failedBackupCount > 0) {
                    toast.warning(
                        `${failedBackupCount} backup file(s) could not be removed from storage.`
                    );
                }

                setOpen(false);
                await queryClient.invalidateQueries({queryKey: ["agent-data", props.agentId]});
            } else {
                toast.error(result.data?.actionError?.message || "Unknown error occurred.");
            }
        },
        onError: () => {
            toast.error("Database deletion did not complete. Some backups may already have been removed — retrying is safe.");
        },
    });

    const trigger = (
        <Button
            variant="outline"
            size="sm"
            disabled={online}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
            }}
        >
            <Trash2 color="red"/>
        </Button>
    );

    return (
        <>
            {online ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>{trigger}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>The agent must be offline to delete a database</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                trigger
            )}

            <DatabaseDeleteDialog
                open={open}
                onOpenChange={setOpen}
                databaseId={props.databaseId}
                databaseName={props.databaseName}
                onConfirm={() => mutation.mutate()}
                isPending={mutation.isPending}
            />
        </>
    );
};
