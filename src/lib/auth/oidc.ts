import { env } from "@/env.mjs";

export interface OIDCProvider {
  id: string;
  title: string;
  description: string;
  icon: string;
  client: string;
  secret: string;
  issuerUrl: string;
  host: string;
  scopes?: string;
  discoveryEndpoint?: string;
  jwksEndpoint?: string;
  pkce: boolean;
  allowedGroup?: string;
  roleMap?: string;
  defaultRole?: string;
  allowLinking: boolean;
  allowUnlinking: boolean;
}

export function getOidcProviders(): OIDCProvider[] {
  const providers: OIDCProvider[] = [];

  if (
    env.AUTH_OIDC_CLIENT &&
    (env.AUTH_OIDC_ISSUER_URL || env.AUTH_OIDC_DISCOVERY_ENDPOINT)
  ) {
    providers.push({
      id: env.AUTH_OIDC_ID || "oidc",
      title: env.AUTH_OIDC_TITLE || "SSO",
      description: env.AUTH_OIDC_DESC || "Sign in with your SSO account.",
      icon: env.AUTH_OIDC_ICON || "lucide:building",
      client: env.AUTH_OIDC_CLIENT,
      secret: env.AUTH_OIDC_SECRET || "",
      issuerUrl: env.AUTH_OIDC_ISSUER_URL || "",
      host: env.AUTH_OIDC_HOST || "",
      scopes: env.AUTH_OIDC_SCOPES,
      discoveryEndpoint: env.AUTH_OIDC_DISCOVERY_ENDPOINT,
      jwksEndpoint: env.AUTH_OIDC_JWKS_ENDPOINT,
      pkce: env.AUTH_OIDC_PKCE === "true",
      allowedGroup: env.ALLOWED_GROUP,
      roleMap: process.env.AUTH_OIDC_ROLE_MAP,
      defaultRole: process.env.AUTH_OIDC_DEFAULT_ROLE,
      allowLinking: process.env.AUTH_OIDC_ALLOW_LINKING !== "false",
      allowUnlinking: process.env.AUTH_OIDC_ALLOW_UNLINKING !== "false",
    });
  }

  const prefixes = new Set<string>();
  Object.keys(process.env).forEach((key) => {
    const match = key.match(/^AUTH_OIDC_(.+)_CLIENT$/);
    if (match) {
      prefixes.add(match[1]);
    }
  });

  prefixes.forEach((prefix) => {
    const client = process.env[`AUTH_OIDC_${prefix}_CLIENT`];
    const issuer = process.env[`AUTH_OIDC_${prefix}_ISSUER_URL`];
    const discovery = process.env[`AUTH_OIDC_${prefix}_DISCOVERY_ENDPOINT`];

    if (!client || (!issuer && !discovery)) return;

    providers.push({
      id: process.env[`AUTH_OIDC_${prefix}_ID`] || prefix.toLowerCase(),
      title: process.env[`AUTH_OIDC_${prefix}_TITLE`] || prefix,
      description:
        process.env[`AUTH_OIDC_${prefix}_DESC`] || `Sign in with ${prefix}`,
      icon: process.env[`AUTH_OIDC_${prefix}_ICON`] || "lucide:building",
      client: client,
      secret: process.env[`AUTH_OIDC_${prefix}_SECRET`] || "",
      issuerUrl: issuer || "",
      host: process.env[`AUTH_OIDC_${prefix}_HOST`] || "",
      scopes: process.env[`AUTH_OIDC_${prefix}_SCOPES`],
      discoveryEndpoint: discovery,
      jwksEndpoint: process.env[`AUTH_OIDC_${prefix}_JWKS_ENDPOINT`],
      pkce: process.env[`AUTH_OIDC_${prefix}_PKCE`] === "true",
      allowedGroup:
        process.env[`AUTH_OIDC_${prefix}_ALLOWED_GROUP`] ||
        process.env.ALLOWED_GROUP,
      roleMap: process.env[`AUTH_OIDC_${prefix}_ROLE_MAP`],
      defaultRole: process.env[`AUTH_OIDC_${prefix}_DEFAULT_ROLE`],
      allowLinking:
        process.env[`AUTH_OIDC_${prefix}_ALLOW_LINKING`] !== "false",
      allowUnlinking:
        process.env[`AUTH_OIDC_${prefix}_ALLOW_UNLINKING`] !== "false",
    });
  });

  return providers;
}
