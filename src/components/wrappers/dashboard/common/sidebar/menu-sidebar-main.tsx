"use client"

import {
    Home,
    Settings,
    Users,
    Layers,
    ChartArea,
    ShieldHalf,
    Building, UserRoundCog, Mail, PackageOpen, Logs, Megaphone, Blocks, Warehouse, BookOpen
} from "lucide-react";
import {SidebarGroupItem, SidebarMenuCustomBase} from "@/components/wrappers/dashboard/common/sidebar/menu-sidebar";
import {authClient} from "@/lib/auth/auth-client";


export const SidebarMenuCustomMain = () => {

    const BASE_URL = `/dashboard`;

    const {data: session, isPending, error} = authClient.useSession();

    if (isPending) return null;

    if (error || !session) {
        return null;
    }

    const groupContentApplication: SidebarGroupItem["group_content"] = [
        {title: "Dashboard", url: "/home", icon: Home, type: "item"},
    ];

    const groupContent: SidebarGroupItem["group_content"] = [
        {title: "Projects", url: "/projects", icon: Layers, details: true, type: "item"},
        {title: "Statistics", url: "/statistics", icon: ChartArea, type: "item"},
        {title: "Settings", url: "/settings", icon: Settings, details: true, type: "item"}
    ];


    const items: SidebarGroupItem[] = [
        {
            label: "Application",
            type: "list",
            group_content: groupContentApplication,
        },
        {
            label: "Organization",
            type: "list",
            group_content: groupContent,
        },
    ];


    if (session?.user.role == "admin" || session?.user.role == "superadmin") {
        items.push({
            label: "Administration",
            type: "list",
            group_content: [
                {
                    title: "Agents",
                    url: "/agents",
                    icon: ShieldHalf,
                    details: true,
                    type: "item"
                },
                {
                    title: "Notifications",
                    url: "/notifications",
                    icon: Megaphone,
                    details: true,
                    type: "collapse",
                    submenu: [
                        { title: "Channels", url: "/notifications/channels", icon: Blocks, type: "item" },
                        { title: "Activity Logs", url: "/notifications/logs", icon: Logs, type: "item" },
                    ],
                },
                {
                    title: "Storages",
                    url: "/storages",
                    icon: Warehouse,
                    details: true,
                    type: "collapse",
                    submenu: [
                        { title: "Channels", url: "/storages/channels", icon: Blocks, type: "item" },
                    ],
                },
                {
                    title: "Access management",
                    url: "/admin",
                    icon: UserRoundCog,
                    details: true,
                    type: "collapse",
                    submenu: [
                        {title: "Users", url: "/admin/users", icon: Users, type: "item"},
                        {title: "Organizations", url: "/admin/organizations", icon: Building, type: "item", details: true},
                    ],
                },
                {
                    title: "Settings",
                    url: "/admin/settings",
                    icon: Settings,
                    type: "item",
                },
            ],
        });
    }

    items.push(
                {
            label: "Resources",
            type: "list",
            group_content: [
                {
                    title: "Documentation",
                    url: "https://portabase.io/docs",
                    icon: BookOpen,
                    type: "item",
                    redirect: true,
                    not_from_base_url: true,
                }
            ],
        },
    )


    return <SidebarMenuCustomBase baseUrl={BASE_URL} items={items}/>;
};