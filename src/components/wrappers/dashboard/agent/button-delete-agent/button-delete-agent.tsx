"use client";

import {Trash2} from "lucide-react";
import {ButtonWithConfirm} from "@/components/wrappers/common/button/button-with-confirm";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {deleteAgentAction} from "@/components/wrappers/dashboard/agent/button-delete-agent/delete-agent.action";
import {useIsMobile} from "@/hooks/use-mobile";

export type ButtonDeleteAgentProps = {
    text?: string;
    agentId: string;
};

export const ButtonDeleteAgent = (props: ButtonDeleteAgentProps) => {
    const router = useRouter();
    const isMobile = useIsMobile();

    const mutation = useMutation({
        mutationFn: () => deleteAgentAction(props.agentId),
        onSuccess: async (result: any) => {
            if (result.data?.success) {
                toast.success(result.data.actionSuccess.message);
                router.push("/dashboard/agents");
            } else {
                toast.error(result.data.actionError.message || "Unknown error occurred.");
            }
        },
    });

    return (
        <ButtonWithConfirm
            title={props.text ? props.text : ""}
            description="Are you sure you want to remove this agent? This action cannot be undone."
            button={{
                main: {
                    text: props.text ? !isMobile ? props.text: "" : "",
                    variant: "outline",
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
                    icon: <Trash2/>,
                    variant: "outline",
                },
            }}
            isPending={mutation.isPending}
        />
    );
};
