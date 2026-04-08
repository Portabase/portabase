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
import {GearIcon} from "@radix-ui/react-icons";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {AgentOrganisationForm} from "@/features/agents/components/agent-organizations.form";
import {AgentWith} from "@/db/schema/08_agent";

type AgentDialogProps = {
    agent?: AgentWith;
    typeTrigger: "edit" | "empty" | "create";
    organization?: OrganizationWithMembers;
    adminView?: boolean,
    organizations?: OrganizationWithMembers[];
};

export const AgentDialog = ({agent, typeTrigger, organization, adminView, organizations}: AgentDialogProps) => {
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
                return <EmptyStatePlaceholder className="h-full" text="Create new Agent"/>;
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
                <>
                    {adminView ?
                        <Tabs className="flex flex-col flex-1" defaultValue="configuration">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                <TabsTrigger value="organizations">Organizations</TabsTrigger>
                            </TabsList>
                            <TabsContent className="h-full justify-between" value="configuration">
                                <AgentForm
                                    organization={organization}
                                    onSuccess={() => {
                                        setOpen(false)
                                        router.refresh()
                                    }}
                                    defaultValues={agent}
                                    agentId={agent?.id}
                                />
                            </TabsContent>
                            <TabsContent className="h-full justify-between" value="organizations">
                                <AgentOrganisationForm
                                    defaultValues={agent}
                                    organizations={organizations}
                                />
                            </TabsContent>
                        </Tabs>
                        :
                        <>
                            <AgentForm
                                organization={organization}
                                onSuccess={() => {
                                    setOpen(false)
                                    router.refresh()
                                }}
                                defaultValues={agent}
                                agentId={agent?.id}
                            />
                        </>
                    }
                </>
            </DialogContent>
        </Dialog>
    );
};
