import { currentUser } from "@/lib/auth/current-user";
import { getAccounts, getSession, getSessions } from "@/lib/auth/auth";
import { LoggedInButtonClient } from "./logged-in-button";
import { SUPPORTED_PROVIDERS } from "@/lib/auth/config";
import { env } from "@/env.mjs";
import { resolveAvatarUrl } from "@/utils/resolve-avatar-url";

export const LoggedInButton = async () => {
    const [user, sessions, currentSession, accounts] = await Promise.all([
        currentUser(),
        getSessions(),
        getSession(),
        getAccounts(),
    ]);

    if (!user) return null;

    return (
        <LoggedInButtonClient
            user={user}
            sessions={sessions}
            // @ts-ignore
            currentSession={currentSession.session}
            accounts={accounts}
            providers={SUPPORTED_PROVIDERS.filter((p) => p.isActive)}
            apiEnabled={env.API_ENABLED}
            avatarUrl={resolveAvatarUrl(user)}
        />
    );
};
