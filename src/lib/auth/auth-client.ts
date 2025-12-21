"use client"
import {createAuthClient} from "better-auth/react";

import {adminClient, inferAdditionalFields, organizationClient, twoFactorClient} from "better-auth/client/plugins";
import {ac, user, admin as adminRole, pending, superadmin, orgAdmin, orgMember, orgOwner} from "./permissions";
import {auth} from "@/lib/auth/auth";
import {getServerUrl} from "@/utils/get-server-url";

const res = await fetch(`${getServerUrl()}/api/config`);
const {PROJECT_URL} = await res.json();

export const authClient = createAuthClient({
    baseURL: PROJECT_URL,
    plugins: [
        twoFactorClient(),
        organizationClient({
            ac,
            roles: {
                owner: orgOwner,
                admin: orgAdmin,
                member: orgMember,
            },
        }),
        adminClient({
            ac,
            roles: {
                admin: adminRole,
                user,
                pending,
                superadmin,
            },
        }),
        inferAdditionalFields<typeof auth>(),
    ],

});

export const {signIn, signOut, signUp, useSession, listAccounts, admin, requestPasswordReset} = authClient;
