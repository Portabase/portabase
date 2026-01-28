"use client";

import { useUpdateCheck } from "../hooks/use-update-check";
import { useSidebar, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { X, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const UpdateNotification = () => {
    const { isUpdateAvailable, latestRelease, dismissUpdate } = useUpdateCheck();
    const { state } = useSidebar();

    if (!isUpdateAvailable || !latestRelease || state !== "expanded") {
        return null;
    }

    return (
        <SidebarGroup className="py-0">
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem className="px-2">
                        <div className="relative flex flex-col gap-2 rounded-lg border bg-primary/5 p-3 text-sidebar-foreground border-primary/20">
                            <button 
                                onClick={dismissUpdate}
                                className="absolute right-2 top-2 rounded-md p-0.5 text-muted-foreground/50 hover:bg-sidebar-accent hover:text-foreground transition-colors"
                            >
                                <X className="size-3" />
                                <span className="sr-only">Dismiss</span>
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <ArrowUpCircle className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-semibold leading-none">Update available</span>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        v{latestRelease.tag_name.replace(/^v/, "")}
                                    </span>
                                </div>
                            </div>

                            <SidebarMenuButton 
                                asChild 
                                variant="outline" 
                                size="sm"
                                className="h-7 w-full justify-center bg-background text-[10px] font-medium shadow-none hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                            >
                                <Link href={latestRelease.html_url} target="_blank">
                                    See what's new
                                </Link>
                            </SidebarMenuButton>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};