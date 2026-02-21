"use client";

import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, Settings, Palette, ShieldHalf, Workflow } from "lucide-react";
import { User } from "@/db/schema/02_user";

interface ProfileSidebarProps {
    user: User;
}

export function ProfileSidebar({ user }: ProfileSidebarProps) {
    return (
        <div className="w-full lg:w-[260px] flex-shrink-0 lg:border-r bg-muted/10 p-4 lg:p-6 flex flex-col gap-4 border-b lg:border-b-0">
            <div className="flex items-center px-2 mb-2">
                <span className="font-bold text-xl tracking-tight">Settings</span>
            </div>

            <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1 justify-start items-stretch">
                <SettingsTabTrigger value="profile" icon={<UserIcon className="w-4 h-4" />}>
                    Profile
                </SettingsTabTrigger>
                <SettingsTabTrigger value="security" icon={<ShieldHalf className="w-4 h-4" />}>
                    Security & Access
                </SettingsTabTrigger>
                <SettingsTabTrigger value="providers" icon={<Workflow className="w-4 h-4" />}>
                    Connected Accounts
                </SettingsTabTrigger>
                <SettingsTabTrigger value="account" icon={<Settings className="w-4 h-4" />}>
                    Account
                </SettingsTabTrigger>
                <SettingsTabTrigger value="appearance" icon={<Palette className="w-4 h-4" />}>
                    Appearance
                </SettingsTabTrigger>
            </TabsList>
        </div>
    );
}

function SettingsTabTrigger({ value, icon, children }: { value: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <TabsTrigger
            value={value}
            className="w-full justify-start gap-3 px-3 py-2.5 rounded-md transition-all whitespace-nowrap flex-shrink-0 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:font-medium hover:bg-muted/50 hover:text-foreground text-muted-foreground"
        >
            {icon}
            {children}
        </TabsTrigger>
    );
}
