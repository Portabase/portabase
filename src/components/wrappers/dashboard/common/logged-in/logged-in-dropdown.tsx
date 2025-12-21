"use client";

import {PropsWithChildren, ReactNode, useState} from "react";
import { useRouter } from "next/navigation";
import { CircleUser, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";
import {ProfileModal} from "@/components/wrappers/dashboard/common/profile/profile-modal";
import {Account, Session, User} from "@/db/schema/02_user";

export type LoggedInDropdownProps = PropsWithChildren<{
    user: User;
    sessions: Session[];
    currentSession: Session;
    accounts: Account[];
    children: ReactNode;
}>;

export const LoggedInDropdown = ({ user, sessions, currentSession, accounts, children }: LoggedInDropdownProps) => {
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
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="min-w-[var(--radix-popper-anchor-width)]">
                    <DropdownMenuItem onClick={() => setIsModalOpen(!isModalOpen)}>
                        <div className="flex justify-start items-center gap-2">
                            <CircleUser size={16} />
                            <span>Account</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
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
                        <div className="flex justify-start items-center gap-2">
                            <LogOut size={16} className="text-red-500" />
                            <span className="text-red-500">Logout</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
