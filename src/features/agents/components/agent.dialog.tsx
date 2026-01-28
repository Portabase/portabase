"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {AgentForm} from "@/features/agents/components/agent.form";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {AgentType} from "@/features/agents/agents.schema";

type AgentDialogProps = {
    children?: React.ReactNode;
    agent?: AgentType & { id: string };
};

export const AgentDialog = ({children, agent}: AgentDialogProps) => {
    const [open, setOpen] = useState(false);
    const isEdit = !!agent;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : <Button><Plus className="mr-2 h-4 w-4"/> Create Agent</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${agent.name}` : "Create new agent"}</DialogTitle>
                </DialogHeader>
                <AgentForm 
                    onSuccess={() => setOpen(false)} 
                    defaultValues={agent}
                    agentId={agent?.id}
                />
            </DialogContent>
        </Dialog>
    );
};