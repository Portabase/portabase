import { env } from "@/env.mjs";
import { getOidcProviders } from "./oidc";

export interface AuthProviderConfig {
  id: string;
  isActive: boolean;
  name?: string;
  icon: string;
  isManual?: boolean;
  title?: string;
  description?: string;
  type: "social" | "sso" | "credential" | "passkey";
  allowLinking?: boolean;
  allowUnlinking?: boolean;
}

const oidcProviders = getOidcProviders();

export const SUPPORTED_PROVIDERS: AuthProviderConfig[] = [
  {
    id: "credential",
    isActive: env.AUTH_EMAIL_PASSWORD_ENABLED === "true",
    name: "Password",
    icon: "lucide:lock",
    title: "Password",
    description: "Standard email and password login.",
    isManual: true,
    type: "credential",
    allowLinking: true,
    allowUnlinking: true,
  },
  {
    id: "google",
    isActive: !!env.AUTH_GOOGLE_ID,
    name: "Google",
    icon: "logos:google-icon",
    title: "Google",
    description: "Sign in with your Google account.",
    type: "social",
    allowLinking: true,
    allowUnlinking: true,
  },
  {
    id: "github",
    isActive: !!env.AUTH_GITHUB_ID,
    name: "GitHub",
    icon: "logos:github-icon",
    title: "GitHub",
    description: "Sign in with your GitHub account.",
    type: "social",
    allowLinking: true,
    allowUnlinking: true,
  },
  ...oidcProviders.map((p) => ({
    id: p.id,
    isActive: true,
    name: p.title,
    icon: p.icon,
    title: p.title,
    description: p.description,
    isManual: true,
    type: "sso" as const,
    allowLinking: p.allowLinking,
    allowUnlinking: p.allowUnlinking,
  })),
  {
    id: "passkey",
    isActive: env.AUTH_PASSKEY_ENABLED === "true",
    name: "Passkey",
    icon: "lucide:fingerprint",
    title: "Passkey",
    description: "Sign in with your passkey.",
    isManual: false,
    type: "passkey",
  },
];
