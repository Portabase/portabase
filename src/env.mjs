import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import packageJson from "../package.json" with { type: "json" };
import path from "path";

const { version } = packageJson;

export const env = createEnv({
    server: {
        NEXT_PUBLIC_PROJECT_VERSION: z.string().optional(),

        NODE_ENV: z.enum(["development", "production"]).optional(),

        DATABASE_URL: z.string().url().optional(),

        PROJECT_NAME: z.string().optional(),
        PROJECT_DESCRIPTION: z.string().optional(),
        PROJECT_URL: z.string().regex(/^https?:\/\//, "URL must start with http:// or https://"),
        PROJECT_SECRET: z.string(),

        SMTP_PASSWORD: z.string().optional(),
        SMTP_FROM: z.string().optional(),
        SMTP_HOST: z.string().optional(),
        SMTP_PORT: z.string().optional(),
        SMTP_USER: z.string().optional(),
        SMTP_SECURE: z.coerce.boolean().default(true),

        AUTH_GOOGLE_ID: z.string().optional(),
        AUTH_GOOGLE_SECRET: z.string().optional(),
        AUTH_GOOGLE_METHOD: z.boolean().default(false),

        AUTH_GITHUB_ID: z.string().optional(),
        AUTH_GITHUB_SECRET: z.string().optional(),

        RETENTION_CRON: z.string().default(process.env.NODE_ENV === "production" ? "0 7 * * *" : "* * * * *"),

        AUTH_OIDC_ID: z.string().optional().default("oidc"),
        AUTH_OIDC_TITLE: z.string().optional(),
        AUTH_OIDC_DESC: z.string().optional(),
        AUTH_OIDC_ICON: z.string().optional(),
        AUTH_OIDC_CLIENT: z.string().optional(),
        AUTH_OIDC_SECRET: z.string().optional(),
        AUTH_OIDC_ISSUER_URL: z.string().optional(),
        AUTH_OIDC_HOST: z.string().optional(),
        AUTH_OIDC_SCOPES: z.string().optional(),
        AUTH_OIDC_DISCOVERY_ENDPOINT: z.string().optional(),
        AUTH_OIDC_JWKS_ENDPOINT: z.string().optional(),
        AUTH_OIDC_PKCE: z.string().optional(),
        ALLOWED_GROUP: z.string().optional(),

        AUTH_EMAIL_PASSWORD_ENABLED: z.string().optional().default("true"),
        AUTH_SIGNUP_ENABLED: z.string().optional().default("true"),
        AUTH_PASSKEY_ENABLED: z.string().optional().default("true"),

        PRIVATE_PATH: z.string().optional(),

    },
    client: {
        NEXT_PUBLIC_PROJECT_VERSION: z.string().optional(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_PROJECT_VERSION: version || "Unknown Version",

        PROJECT_NAME: process.env.PROJECT_NAME,
        PROJECT_DESCRIPTION: process.env.PROJECT_DESCRIPTION,
        PROJECT_URL: process.env.PROJECT_URL,
        PROJECT_SECRET: process.env.PROJECT_SECRET,

        DATABASE_URL: process.env.DATABASE_URL,

        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        SMTP_FROM: process.env.SMTP_FROM,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_SECURE: process.env.SMTP_SECURE,

        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
        AUTH_GOOGLE_METHOD: process.env.AUTH_GOOGLE_METHOD === "true",

        AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
        AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,

        RETENTION_CRON: process.env.RETENTION_CRON,

        AUTH_OIDC_ID: process.env.AUTH_OIDC_ID,
        AUTH_OIDC_TITLE: process.env.AUTH_OIDC_TITLE,
        AUTH_OIDC_DESC: process.env.AUTH_OIDC_DESC,
        AUTH_OIDC_ICON: process.env.AUTH_OIDC_ICON,
        AUTH_OIDC_CLIENT: process.env.AUTH_OIDC_CLIENT,
        AUTH_OIDC_SECRET: process.env.AUTH_OIDC_SECRET,
        AUTH_OIDC_ISSUER_URL: process.env.AUTH_OIDC_ISSUER_URL,
        AUTH_OIDC_HOST: process.env.AUTH_OIDC_HOST,
        AUTH_OIDC_SCOPES: process.env.AUTH_OIDC_SCOPES,
        AUTH_OIDC_DISCOVERY_ENDPOINT: process.env.AUTH_OIDC_DISCOVERY_ENDPOINT,
        AUTH_OIDC_JWKS_ENDPOINT: process.env.AUTH_OIDC_JWKS_ENDPOINT,
        AUTH_OIDC_PKCE: process.env.AUTH_OIDC_PKCE,
        ALLOWED_GROUP: process.env.ALLOWED_GROUP,

        AUTH_EMAIL_PASSWORD_ENABLED: process.env.AUTH_EMAIL_PASSWORD_ENABLED,
        AUTH_SIGNUP_ENABLED: process.env.AUTH_SIGNUP_ENABLED,
        AUTH_PASSKEY_ENABLED: process.env.AUTH_PASSKEY_ENABLED,

        PRIVATE_PATH: process.env.PRIVATE_PATH || path.join(process.cwd(), 'private')
    },
});
