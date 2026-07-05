"use client";

import {Trash2} from "lucide-react";
import {ButtonWithConfirm} from "@/components/common/button-with-confirm";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {deleteDatabaseAction} from "@/features/database/actions/database-delete.action";

export type DatabaseDeleteButtonProps = {
    databaseId: string;
    agentId: string;
};

export const DatabaseDeleteButton = (props: DatabaseDeleteButtonProps) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => deleteDatabaseAction({databaseId: props.databaseId}),
        onSuccess: async (result: any) => {
            if (result.data?.success) {
                toast.success(result.data.actionSuccess.message);
                await queryClient.invalidateQueries({queryKey: ["agent-data", props.agentId]});
            } else {
                toast.error(result.data?.actionError?.message || "Unknown error occurred.");
            }
        },
        onError: () => {
            toast.error("Failed to delete database.");
        },
    });

    return (
        <ButtonWithConfirm
            title="Delete database"
            description="Are you sure you want to delete this database? It will be unlinked from this agent."
            button={{
                main: {
                    text: "",
                    variant: "outline",
                    size: "sm",
                    icon: <Trash2 color="red"/>,
                },
                confirm: {
                    className: "w-full",
                    text: "Delete",
                    icon: <Trash2/>,
                    variant: "destructive",
                    onClick: () => {
                        mutation.mutate();
                    },
                },
                cancel: {
                    className: "w-full",
                    text: "Cancel",
                    variant: "outline",
                },
            }}
            isPending={mutation.isPending}
        />
    );
};
