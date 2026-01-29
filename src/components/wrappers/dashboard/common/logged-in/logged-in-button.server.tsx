import {currentUser} from "@/lib/auth/current-user";
import {getAccounts, getSession, getSessions} from "@/lib/auth/auth";
import {LoggedInButtonClient} from "./logged-in-button";
import {SUPPORTED_PROVIDERS} from "../../../../../../portabase.config";


export const LoggedInButton = async () => {
    const user = await currentUser();
    const sessions = await getSessions();
    const currentSession = await getSession();
    const accounts = await getAccounts();


    if (!user) return null;

    return (
        <LoggedInButtonClient
            user={user}
            sessions={sessions}
            // @ts-ignore
            currentSession={currentSession.session}
            accounts={accounts}
            providers={SUPPORTED_PROVIDERS.filter((p) => p.isActive)}
        />
    );
};
