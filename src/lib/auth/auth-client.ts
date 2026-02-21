"use client"
import {createAuthClient} from "better-auth/react";

import {adminClient, inferAdditionalFields, organizationClient, twoFactorClient} from "better-auth/client/plugins";
import {ac, user, admin as adminRole, pending, superadmin, orgAdmin, orgMember, orgOwner} from "./permissions";
import type {auth} from "@/lib/auth/auth";
import {getServerUrl} from "@/utils/get-server-url";
import { ssoClient } from "@better-auth/sso/client";
import { passkeyClient } from "@better-auth/passkey/client"

const res = await fetch(`${getServerUrl()}/api/config`);
const {PROJECT_URL} = await res.json();

export const authClient = createAuthClient({
    baseURL: PROJECT_URL,
    plugins: [
        passkeyClient(),
        twoFactorClient(),
        ssoClient(),
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

export const { signIn, signOut, signUp, deleteUser, useSession, listAccounts, passkey, admin, twoFactor, requestPasswordReset, sso } = authClient;