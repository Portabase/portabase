// import { ChevronUp } from "lucide-react";
//
// import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
// import { currentUser } from "@/lib/auth/current-user";
// import { SidebarMenuButton } from "@/components/ui/sidebar";
// import { getAccounts, getSession, getSessions } from "@/lib/auth/auth";
// import {LoggedInDropdown} from "@/components/wrappers/dashboard/common/logged-in/logged-in-dropdown";
//
// export const LoggedInButton = async () => {
//     const user = await currentUser();
//     const sessions = await getSessions();
//     const currentSession = await getSession();
//     const accounts = await getAccounts();
//
//     if (!user) return null;
//
//
//     return (
//         <>
//             <LoggedInDropdown
//                 // @ts-ignore
//                 user={user}
//                 // @ts-ignore
//                 sessions={sessions}
//                 // @ts-ignore
//                 currentSession={currentSession.session}
//                 // @ts-ignore
//                 accounts={accounts}
//             >
//                 <SidebarMenuButton>
//
//                     <Avatar className="size-6">
//                         <AvatarFallback>{user?.name[0].toUpperCase()}</AvatarFallback>
//                         {user?.image ? <AvatarImage src={user?.image} alt={`${user.name ?? "-"}'s profile picture`} /> : null}
//                     </Avatar>
//
//                     <span className="first-letter:capitalize">{user?.name}</span>
//                     <ChevronUp className="ml-auto" />
//                 </SidebarMenuButton>
//             </LoggedInDropdown>
//         </>
//     );
// };
"use client";

import {ChevronUp} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {SidebarMenuButton} from "@/components/ui/sidebar";
import {LoggedInDropdown} from "./logged-in-dropdown";
import {Account, Session, User} from "better-auth";

type LoggedInButtonClientProps = {
    user: User;
    sessions: Session[];
    currentSession: Session;
    accounts: Account[];
}

export const LoggedInButtonClient = ({user, sessions, currentSession, accounts}: LoggedInButtonClientProps) => {

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
        >
            <SidebarMenuButton type="button">
                <Avatar className="size-6">
                    <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
                    {user.image && <AvatarImage src={user.image}/>}
                </Avatar>

                <span className="first-letter:capitalize">{user.name}</span>
                <ChevronUp className="ml-auto"/>
            </SidebarMenuButton>
        </LoggedInDropdown>
    );
};
