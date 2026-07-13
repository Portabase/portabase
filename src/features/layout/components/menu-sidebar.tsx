"use client";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

export type SidebarItem = {
    title: string;
    url: string;
    redirect?: boolean;
    not_from_base_url?: boolean;
    icon: React.ElementType;
    dropdown?: SidebarItem[];
    submenu?: SidebarItem[];
    details?: boolean;
    type: "item" | "collapse";
};

export type SidebarGroupItem = {
    label: string;
    type: "list" | "collapse";
    group_content: SidebarItem[];
};

type SidebarMenuCustomBaseProps = {
    baseUrl: string;
    items: SidebarGroupItem[];
};

export const SidebarMenuCustomBase = ({ baseUrl, items }: SidebarMenuCustomBaseProps) => {
    const pathname = usePathname();

    const normalize = (url: string) => url.split("?")[0].replace(/\/$/, "");

    const isItemActive = (item: SidebarItem) => {
        const fullUrl = item.not_from_base_url ? normalize(item.url) : normalize(`${baseUrl}${item.url}`);
        if (item.details) return normalize(pathname).startsWith(fullUrl);
        return normalize(pathname) === fullUrl;
    };

    const isSubActive = (item: SidebarItem) => {
        if (!item.submenu) return false;
        return item.submenu.some((sub) => isItemActive(sub));
    };

    return (
        <SidebarMenu>
            {items.map((group, index) => (
                <Collapsible key={index} defaultOpen className="group/group-collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger disabled={group.type === "list"} className="flex w-full items-center text-sm font-medium text-sidebar-foreground/70">
                                {group.label}
                                {group.type === "collapse" && (
                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/group-collapsible:rotate-180" />
                                )}
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                {group.group_content.map((item, idx) => {
                                    if (item.type === "collapse" && item.submenu) {
                                        const isChildActive = isSubActive(item);

                                        return (
                                            <Collapsible key={idx} asChild defaultOpen={isChildActive} className="group/collapsible">
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-between")}>
                                                            <item.icon />
                                                            <span>{item.title}</span>
                                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.submenu.map((sub, subIdx) => (
                                                                <SidebarMenuSubItem key={subIdx}>
                                                                    <SidebarMenuSubButton asChild isActive={isItemActive(sub)}>
                                                                        <Link
                                                                            href={sub.not_from_base_url ? sub.url : `${baseUrl}${sub.url}`}
                                                                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start")}
                                                                        >
                                                                            <sub.icon />
                                                                            <span>{sub.title}</span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        );
                                    }

                                    return (
                                        <SidebarMenuItem key={idx}>
                                            <SidebarMenuButton asChild isActive={isItemActive(item)} tooltip={item.title}>
                                                <Link
                                                    href={item.redirect || item.not_from_base_url ? item.url : `${baseUrl}${item.url}`}
                                                    target={item.redirect ? "_blank" : ""}
                                                    className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-start")}
                                                >
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {item.dropdown && (
                                                <SidebarMenuAction showOnHover>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <MoreHorizontal />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent side="right" align="start">
                                                            {item.dropdown.map((dropdown, dIdx) => (
                                                                <DropdownMenuItem key={dIdx} asChild>
                                                                    <Link
                                                                        href={dropdown.redirect || dropdown.not_from_base_url ? dropdown.url : `${baseUrl}${dropdown.url}`}
                                                                        target={dropdown.redirect ? "_blank" : ""}
                                                                    >
                                                                        <span>{dropdown.title}</span>
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </SidebarMenuAction>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            ))}
        </SidebarMenu>
    );
};
