"use client";

import {useState} from "react";
import Link from "next/link";
import {Card} from "@/components/ui/card";
import {ConnectionCircle} from "@/components/wrappers/common/connection-circle";
import {formatDateLastContact} from "@/utils/date-formatting";
import {AgentWith} from "@/db/schema/08_agent";
import {Activity, ChevronRight, Copy, Check, Fingerprint, Server, Database, ShieldCheck} from "lucide-react";
import {Badge} from "@/components/ui/badge";

export type agentCardProps = {
    data: AgentWith;
};

export const AgentCard = (props: agentCardProps) => {
    const {data: agent} = props;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(agent.id);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Link 
            href={`/dashboard/agents/${agent.id}`}
            className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
            <Card className="flex flex-row items-center p-4 gap-5 transition-all border-border/50 bg-card hover:bg-accent/50 hover:border-primary/50 group-hover:shadow-md overflow-hidden">
                <div className="relative w-12 h-12 p-2.5 bg-background rounded-xl border border-border/50 shadow-sm flex items-center justify-center group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105 shrink-0">
                    <Server className="w-6 h-6 text-foreground/80 group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate tracking-tight leading-none">
                            {agent.name}
                        </h3>
                        {agent.version && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold tracking-wider">
                                v{agent.version}
                            </Badge>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-muted-foreground group-hover:text-foreground transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-mono text-xs font-bold truncate opacity-80">
                                {agent.id}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="ml-0.5 p-1 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
                                title="Copy ID"
                            >
                                {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>

                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <Database className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-tight opacity-80">
                                {agent.databases?.length ?? 0} DBs
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                     <div className="hidden sm:flex flex-col items-end gap-1 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Last Contact</span>
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                             <span className="text-xs font-bold uppercase tracking-tight">
                                {formatDateLastContact(agent.lastContact)}
                            </span>
                        </div>
                    </div>

                    <div className="scale-110">
                        <ConnectionCircle date={agent.lastContact}/>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </Card>
        </Link>
    );
};
