import { env } from "@/env.mjs";

export interface OAuthProvider {
  id: string;
  title: string;
  description: string;
  icon: string;
  client: string;
  secret: string;
  allowedGroup?: string;
  roleMap?: string;
  defaultRole?: string;
  allowLinking: boolean;
  allowUnlinking: boolean;
  appleBundleIdentifier?: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  google: "logos:google-icon",
  github: "logos:github-icon",
  gitlab: "logos:gitlab-icon",
  discord: "logos:discord-icon",
  facebook: "logos:facebook",
  twitter: "logos:twitter",
  x: "logos:x",
  linkedin: "logos:linkedin-icon",
  apple: "logos:apple",
  microsoft: "logos:microsoft-icon",
  twitch: "logos:twitch",
  spotify: "logos:spotify-icon",
  slack: "logos:slack-icon",
  tiktok: "logos:tiktok-icon",
  figma: "logos:figma",
  dropbox: "logos:dropbox",
  notion: "logos:notion-icon",
  paypal: "logos:paypal",
  reddit: "logos:reddit-icon",
  salesforce: "logos:salesforce",
  vercel: "logos:vercel-icon",
  zoom: "logos:zoom-icon",
  altassian: "logos:jira",
};

function getProviderIcon(providerId: string, envIcon?: string): string {
  if (envIcon) return envIcon;

  const normalizedId = providerId.toLowerCase();

  if (PROVIDER_ICONS[normalizedId]) {
    return PROVIDER_ICONS[normalizedId];
  }

  return `lucide:building`;
}

export function getOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = [];

  if (env.AUTH_SOCIAL_CLIENT && env.AUTH_SOCIAL_ID) {
    providers.push({
      id: env.AUTH_SOCIAL_ID,
      title: env.AUTH_SOCIAL_TITLE || "OAuth",
      description: env.AUTH_SOCIAL_DESC || "Sign in with your OAuth account.",
      icon: env.AUTH_SOCIAL_ICON || "lucide:building",
      client: env.AUTH_SOCIAL_CLIENT,
      secret: env.AUTH_SOCIAL_SECRET || "",
      allowedGroup: env.ALLOWED_GROUP,
      roleMap: env.AUTH_ROLE_MAP,
      defaultRole: env.AUTH_DEFAULT_ROLE,
      allowLinking: env.AUTH_ALLOW_LINKING !== "false",
      allowUnlinking: env.AUTH_ALLOW_UNLINKING !== "false",
      appleBundleIdentifier: env.AUTH_SOCIAL_APPLE_APP_BUNDLE_IDENTIFIER,
    });
  }

  const prefixes = new Set<string>();
  Object.keys(process.env).forEach((key) => {
    const match = key.match(/^AUTH_SOCIAL_(.+)_CLIENT$/);
    if (match) {
      prefixes.add(match[1]);
    }
  });

  prefixes.forEach((prefix) => {
    const client = process.env[`AUTH_SOCIAL_${prefix}_CLIENT`];
    if (!client) return;

    const providerId = prefix.toLowerCase();

    const envTitle = process.env[`AUTH_SOCIAL_${prefix}_TITLE`];
    const envDesc = process.env[`AUTH_SOCIAL_${prefix}_DESC`];
    const envIcon = process.env[`AUTH_SOCIAL_${prefix}_ICON`];
    const envSecret = process.env[`AUTH_SOCIAL_${prefix}_SECRET`];
    const envAllowedGroup = process.env[`AUTH_SOCIAL_${prefix}_ALLOWED_GROUP`];
    const envRoleMap = process.env[`AUTH_SOCIAL_${prefix}_ROLE_MAP`];
    const envDefaultRole = process.env[`AUTH_SOCIAL_${prefix}_DEFAULT_ROLE`];

    const envAppleBundleId =
      process.env[`AUTH_SOCIAL_APPLE_APP_BUNDLE_IDENTIFIER`];

    providers.push({
      id: providerId,
      title:
        envTitle ||
        prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase(),
      description:
        envDesc ||
        `Sign in with ${prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()}`,
      icon: getProviderIcon(providerId, envIcon),
      client: client,
      secret: envSecret || "",
      allowedGroup: envAllowedGroup || env.ALLOWED_GROUP,
      roleMap: envRoleMap,
      defaultRole: envDefaultRole,
      allowLinking: env.AUTH_ALLOW_LINKING !== "false",
      allowUnlinking: env.AUTH_ALLOW_UNLINKING !== "false",
      appleBundleIdentifier: envAppleBundleId,
    });
  });

  return providers;
}
