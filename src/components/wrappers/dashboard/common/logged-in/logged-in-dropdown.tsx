"use client";

import { PropsWithChildren, ReactNode, useState } from "react";

import { useRouter } from "next/navigation";

import { LogOut, User } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { signOut } from "@/lib/auth/auth-client";

import { ProfileModal } from "@/components/wrappers/dashboard/common/profile/profile-modal";

import { Account, Session, User as UserType } from "@/db/schema/02_user";

import { AuthProviderConfig } from "@/lib/auth/config";

export type LoggedInDropdownProps = PropsWithChildren<{
    user: UserType;
    sessions: Session[];
    currentSession: Session;
    accounts: Account[];
    children: ReactNode;
    providers: AuthProviderConfig[];
}>;

export const LoggedInDropdown = ({ user, sessions, currentSession, accounts, children, providers }: LoggedInDropdownProps) => {
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <ProfileModal
                user={user}
                sessions={sessions}
                currentSession={currentSession}
                accounts={accounts}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                providers={providers}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[var(--radix-popper-anchor-width)] rounded-xl border-2 border-border bg-popover shadow-none p-1"
                    align="start"
                    side="top"
                    sideOffset={8}
                >
                    <DropdownMenuItem
                        onClick={() => setIsModalOpen(!isModalOpen)}
                        className="group gap-2 p-1 cursor-pointer rounded-lg mb-1 transition-colors focus:bg-accent hover:bg-accent/50 border border-transparent"
                    >
                        <div className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 shadow-sm transition-all group-hover:shadow-md group-hover:bg-background">
                            <User size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none">Account Settings</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="group gap-2 p-1 cursor-pointer rounded-lg transition-colors focus:bg-red-50 dark:focus:bg-red-950/20 border border-transparent text-red-600 focus:text-red-600"
                        onClick={async () => {
                            await signOut({
                                fetchOptions: {
                                    onSuccess: () => {
                                        router.push("/login");
                                    },
                                },
                            });
                        }}
                    >
                        <div className="flex size-9 items-center justify-center rounded-md border border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20 shadow-sm transition-all group-hover:shadow-md">
                            <LogOut size={18} className="text-red-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none">Logout</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
