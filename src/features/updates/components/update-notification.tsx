"use client";

import {useUpdateCheck} from "../hooks/use-update-check";
import {useSidebar, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem} from "@/components/ui/sidebar";
import {X, ArrowUpCircle, MoveRight} from "lucide-react";
import Link from "next/link";


export const UpdateNotification = () => {
    const {isUpdateAvailable, newRelease, dismissUpdate} = useUpdateCheck();
    const {state} = useSidebar();

    if (!isUpdateAvailable || !newRelease || state !== "expanded") {
        return null;
    }

    return (
        <SidebarGroup className="py-0">
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div
                            className="w-[var(--radix-popper-anchor-width)] relative flex flex-col gap-2 rounded-lg border bg-primary/5 p-3 text-sidebar-foreground border-primary/20">
                            <button
                                onClick={dismissUpdate}
                                className="absolute right-2 top-2 rounded-md p-0.5 text-muted-foreground/50 hover:bg-sidebar-accent hover:text-foreground transition-colors"
                            >
                                <X className="size-3"/>
                                <span className="sr-only">Dismiss</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <div
                                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <ArrowUpCircle className="size-4"/>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-semibold leading-none">Update available</span>
                                        {newRelease.tag_name && (
                                            <span
                                                className="text-[10px] text-muted-foreground font-medium px-1 py-0.5 bg-primary/10 rounded-full">
                                                v{newRelease.tag_name.replace(/^v/, "")}
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href={newRelease.html_url}
                                        target="_blank"
                                        className="group inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-1"
                                    >
                                        See what's new
                                        <MoveRight className="size-3 transition-transform group-hover:translate-x-0.5"/>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
};