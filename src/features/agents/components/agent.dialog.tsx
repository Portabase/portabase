"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {AgentForm} from "@/features/agents/components/agent.form";
import {Button, buttonVariants} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {AgentType} from "@/features/agents/agents.schema";
import {GearIcon} from "@radix-ui/react-icons";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {useState} from "react";
import {useRouter} from "next/navigation";

type AgentDialogProps = {
    agent?: AgentType & { id: string };
    typeTrigger: "edit" | "empty" | "create";
};


export const AgentDialog = ({agent, typeTrigger}: AgentDialogProps) => {
    const [open, setOpen] = useState(false);
    const isEdit = !!agent;
    const router = useRouter();

    const getTrigger = () => {
        switch (typeTrigger) {
            case "edit":
                return (
                    <div className={buttonVariants({variant: "outline", className: "cursor-pointer"})}>
                        <GearIcon className="w-7 h-7"/>
                    </div>
                );
            case "empty":
                return <EmptyStatePlaceholder text="Create new Agent"/>;
            case "create":
                return <Button><Plus className="mr-2 h-4 w-4"/> Create Agent</Button>;
            default:
                return <Button><Plus className="mr-2 h-4 w-4"/> Create Agent</Button>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{getTrigger()}</DialogTrigger>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${agent.name}` : "Create new agent"}</DialogTitle>
                </DialogHeader>
                <AgentForm
                    onSuccess={() => {
                        setOpen(false)
                        router.refresh()
                    }}
                    defaultValues={agent}
                    agentId={agent?.id}
                />
            </DialogContent>
        </Dialog>
    );
};
