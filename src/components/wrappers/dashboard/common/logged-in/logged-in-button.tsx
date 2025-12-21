import { ChevronUp } from "lucide-react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import { currentUser } from "@/lib/auth/current-user";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { getAccounts, getSession, getSessions } from "@/lib/auth/auth";
import {LoggedInDropdown} from "@/components/wrappers/dashboard/common/logged-in/logged-in-dropdown";

export const LoggedInButton = async () => {
    const user = await currentUser();
    const sessions = await getSessions();
    const currentSession = await getSession();
    const accounts = await getAccounts();

    if (!user) return null;

    return (
        <>
            <LoggedInDropdown
                // @ts-ignore
                user={user}
                // @ts-ignore
                sessions={sessions}
                // @ts-ignore
                currentSession={currentSession.session}
                // @ts-ignore
                accounts={accounts}
            >
                <SidebarMenuButton>

                    <Avatar className="size-6">
                        <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
                        {user.image ? <AvatarImage src={user.image} alt={`${user.name ?? "-"}'s profile picture`} /> : null}
                    </Avatar>

                    <span className="first-letter:capitalize">{user.name}</span>
                    <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
            </LoggedInDropdown>
        </>
    );
};
