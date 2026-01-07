"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import {ProjectWith} from "@/db/schema/06_project";
import {ChevronRight, Folder} from "lucide-react";
import {Badge} from "@/components/ui/badge";

export type projectCardProps = {
    data: ProjectWith;
    organizationSlug?: string;
};

export const ProjectCard = (props: projectCardProps) => {
    const { data: project } = props;
    const dbCount = project.databases.length;

    return (
        <Link
            href={`/dashboard/projects/${project.id}`}
            className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
            <Card className="relative h-full flex flex-col p-4 transition-all border-border/50 bg-card hover:bg-accent/50 hover:border-primary/50 group-hover:shadow-lg overflow-hidden gap-0">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                        <Folder className="w-8 h-8" />
                    </div>
                    <Badge className="text-[10px] font-medium px-2 py-1 rounded-lg bg-secondary/50 text-foreground">{dbCount} {dbCount === 1 ? "Database" : "Databases"}
                    </Badge>
                    
                </div>

                <div className="flex flex-col gap-2 flex-1">
                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
                        {project.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        Manage your databases and backup policies for this project.
                    </p>
                </div>
                
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">View Project</span>
                    <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:hidden">Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </Card>
        </Link>
    );
};
