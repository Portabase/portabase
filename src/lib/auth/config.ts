import { env } from "@/env.mjs";
import { getOidcProviders } from "./oidc";
import { getOAuthProviders } from "./oauth";
import * as BetterAuthSocialProviders from "better-auth/social-providers";

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
const oauthProviders = getOAuthProviders();

const availableSocialProviders = Object.keys(BetterAuthSocialProviders);

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
  ...oauthProviders.map((p) => {
    const isSupported = availableSocialProviders.includes(p.id.toLowerCase());

    if (!isSupported) {
      console.warn(`Provider ${p.id} is not supported. Skipping...`);
    }

    return {
      id: p.id,
      isActive: isSupported,
      name: p.title,
      icon: p.icon,
      title: p.title,
      description: p.description,
      isManual: false,
      type: "social" as const,
      allowLinking: p.allowLinking,
      allowUnlinking: p.allowUnlinking,
    };
  }),
  ...oidcProviders.map((p) => ({
    id: p.id,
    isActive: true,
    name: p.title,
    icon: p.icon,
    title: p.title,
    description: p.description,
    isManual: false,
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
