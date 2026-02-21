import { env } from "@/env.mjs";

export interface AuthProviderConfig {
    id: string;
    isActive: boolean;
    name?: string;
    icon: string;
    isManual?: boolean;
    title?: string;
    description?: string;
    type: "social" | "sso" | "credential" | "passkey";
}

export const SUPPORTED_PROVIDERS: AuthProviderConfig[] = [
    {
        id: "credential",
        isActive: env.AUTH_EMAIL_PASSWORD_ENABLED === "true",
        name: "Password",
        icon: "lucide:lock",
        title: "Password",
        description: "Standard email and password login.",
        isManual: true,
        type: "credential"
    },
    {
        id: "google",
        isActive: !!env.AUTH_GOOGLE_ID,
        name: "Google",
        icon: "logos:google-icon",
        title: "Google",
        description: "Sign in with your Google account.",
        type: "social"
    },
    {
        id: "github",
        isActive: !!env.AUTH_GITHUB_ID,
        name: "GitHub",
        icon: "logos:github-icon",
        title: "GitHub",
        description: "Sign in with your GitHub account.",
        type: "social"
    },
    {
        id: env.AUTH_OIDC_ID || "oidc",
        isActive: !!env.AUTH_OIDC_CLIENT,
        name: env.AUTH_OIDC_TITLE || "SSO",
        icon: env.AUTH_OIDC_ICON || "lucide:building",
        title: env.AUTH_OIDC_TITLE || "SSO",
        description: env.AUTH_OIDC_DESC || "Sign in with your SSO account.",
        isManual: true,
        type: "sso"
    },
    {
        id: "passkey",
        isActive: env.AUTH_PASSKEY_ENABLED === "true",
        name: "Passkey",
        icon: "lucide:fingerprint",
        title: "Passkey",
        description: "Sign in with your passkey.",
        isManual: false,
        type: "passkey"
    }
];