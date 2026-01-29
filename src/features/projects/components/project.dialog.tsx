"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {ProjectForm} from "@/features/projects/components/project.form";
import {ReactNode, useState} from "react";
import {Button, buttonVariants} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {DatabaseWith} from "@/db/schema/07_database";
import {Organization} from "@/db/schema/03_organization";
import {ProjectWith} from "@/db/schema/06_project";
import {GearIcon} from "@radix-ui/react-icons";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";

type ProjectDialogProps = {
    children?: ReactNode;
    databases: DatabaseWith[];
    organization: Organization;
    project?: ProjectWith;
    isEdit?: boolean;
    isEmpty?: boolean;
};

export const ProjectDialog = ({
                                  databases,
                                  organization,
                                  project,
                                  isEdit = false,
                                  isEmpty = false
                              }: ProjectDialogProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div>
                    {isEdit ?
                        <div className={buttonVariants({variant: "outline", className: "cursor-pointer"})}>
                            <GearIcon className="w-7 h-7"/>
                        </div>
                        :
                        <>
                            {isEmpty ?
                                <EmptyStatePlaceholder text="Create new Project"/>
                                :
                                <Button><Plus className="mr-2 h-4 w-4"/> Create Project</Button>
                            }
                        </>
                    }
                </div>
            </DialogTrigger>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${project?.name}` : "Create new project"}</DialogTitle>
                </DialogHeader>
                <ProjectForm
                    onSuccess={() => setOpen(false)}
                    databases={databases}
                    organization={organization}
                    defaultValues={project ? {
                        ...project,
                        databases: project.databases.map(db => db.id)
                    } : undefined}
                    projectId={project?.id}
                />
            </DialogContent>
        </Dialog>
    );
};