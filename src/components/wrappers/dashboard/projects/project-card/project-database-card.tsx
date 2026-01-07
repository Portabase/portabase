"use client";

import Link from "next/link";
import Image from "next/image";
import {useState} from "react";
import {Card} from "@/components/ui/card";
import {ConnectionCircle} from "@/components/wrappers/common/connection-circle";
import {formatDateLastContact} from "@/utils/date-formatting";
import {Database} from "@/db/schema/07_database";
import {ChevronRight, Activity, Fingerprint, Copy, Check} from "lucide-react";

export type projectDatabaseCardProps = {
    data: Database;
    extendedProps: any;
    organizationSlug: string;
};

export const ProjectDatabaseCard = (props: projectDatabaseCardProps) => {
    const {data: database, extendedProps: extendedProps} = props;

    return (
        <Link className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              href={`/dashboard/projects/${extendedProps.id}/database/${database.id}`}>
            <DatabaseCard data={database}/>
        </Link>
    );
};

export type databaseCardProps = {
    data: Database;
};

export const DatabaseCard = (props: databaseCardProps) => {
    const {data: database} = props;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(database.agentDatabaseId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Card className="relative h-full flex flex-col p-6 transition-all border-border/50 bg-card hover:bg-accent/50 hover:border-primary/50 group-hover:shadow-lg overflow-hidden">
            <div className="flex items-start justify-between mb-6">
                <div className="relative w-16 h-16 p-3 bg-background rounded-2xl border border-border/50 shadow-sm flex items-center justify-center group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105">
                    <Image 
                        src={`/images/${database.dbms}.png`} 
                        alt={`${database.dbms} icon`}
                        width={48} 
                        height={48}
                        className="object-contain w-full h-full"
                    />
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="scale-125 origin-right">
                        <ConnectionCircle date={database.lastContact}/>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                    {database.name}
                </h3>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="p-1.5 bg-muted/50 rounded-lg">
                            <Fingerprint className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-bold truncate">
                            {database.agentDatabaseId}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="ml-1 p-1 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
                            title="Copy ID"
                        >
                            {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-2.5 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="p-1.5 bg-muted/50 rounded-lg">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight">
                            {formatDateLastContact(database.lastContact)}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">Open Explorer</span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest group-hover:hidden">Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Card>
    );
};
