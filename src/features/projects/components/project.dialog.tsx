"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {ProjectForm} from "@/features/projects/components/project.form";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {DatabaseWith} from "@/db/schema/07_database";
import {Organization} from "@/db/schema/03_organization";
import {ProjectWith} from "@/db/schema/06_project";

type ProjectDialogProps = {
    children?: React.ReactNode;
    databases: DatabaseWith[];
    organization: Organization;
    project?: ProjectWith;
};

export const ProjectDialog = ({children, databases, organization, project}: ProjectDialogProps) => {
    const [open, setOpen] = useState(false);
    const isEdit = !!project;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : <Button><Plus className="mr-2 h-4 w-4"/> Create Project</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit ${project.name}` : "Create new project"}</DialogTitle>
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