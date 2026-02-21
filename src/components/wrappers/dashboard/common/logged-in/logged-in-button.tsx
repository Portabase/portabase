"use client";

import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { LoggedInDropdown } from "./logged-in-dropdown";
import { Account, Session, User } from "better-auth";
import { AuthProviderConfig } from "@/lib/auth/config";

type LoggedInButtonClientProps = {
    user: User;
    sessions: Session[];
    currentSession: Session;
    accounts: Account[];
    providers: AuthProviderConfig[];
};

export const LoggedInButtonClient = ({ user, sessions, currentSession, accounts, providers }: LoggedInButtonClientProps) => {
    return (
        <LoggedInDropdown
            // @ts-ignore
            user={user}
            // @ts-ignore
            sessions={sessions}
            // @ts-ignore
            currentSession={currentSession}
            // @ts-ignore
            accounts={accounts}
            providers={providers}
        >
            <SidebarMenuButton type="button" className="h-auto  justify-between py-2">
                <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                        <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
                        {user.image && <AvatarImage src={user.image} />}
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium first-letter:capitalize max-w-[170px] truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground max-w-[170px] truncate" title={user.email}>
                            {user.email}
                        </span>
                    </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
        </LoggedInDropdown>
    );
};
