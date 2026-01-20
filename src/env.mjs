import {createEnv} from "@t3-oss/env-nextjs";
import {z} from "zod";
import packageJson from "../package.json" with {type: "json"};

const {version} = packageJson;

export const env = createEnv({
    server: {
        NEXT_PUBLIC_PROJECT_VERSION: z.string().optional(),

        NODE_ENV: z.enum(["development", "production"]).optional(),

        DATABASE_URL: z.string().url().optional(),

        PROJECT_NAME: z.string().optional(),
        PROJECT_DESCRIPTION: z.string().optional(),
        PROJECT_URL: z.string().optional(),
        PROJECT_SECRET: z.string().optional(),

        SMTP_PASSWORD: z.string().optional(),
        SMTP_FROM: z.string().optional(),
        SMTP_HOST: z.string().optional(),
        SMTP_PORT: z.string().optional(),
        SMTP_USER: z.string().optional(),
        SMTP_SECURE: z.coerce.boolean().default(true),

        AUTH_GOOGLE_ID: z.string().optional(),
        AUTH_GOOGLE_SECRET: z.string().optional(),
        AUTH_GOOGLE_METHOD: z.boolean().default(false),

        S3_ENDPOINT: z.string().optional(),
        S3_ACCESS_KEY: z.string().optional(),
        S3_SECRET_KEY: z.string().optional(),
        S3_BUCKET_NAME: z.string().optional(),
        S3_PORT: z.string().optional(),
        S3_USE_SSL: z.string().optional(),

        STORAGE_TYPE: z.enum(["local", "s3"]).optional(),

        RETENTION_CRON: z
            .string()
            .default(process.env.NODE_ENV === "production" ? "0 7 * * *" : "* * * * *"),

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

        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
        S3_SECRET_KEY: process.env.S3_SECRET_KEY,
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
        S3_PORT: process.env.S3_PORT,
        S3_USE_SSL: process.env.S3_USE_SSL,

        STORAGE_TYPE: process.env.STORAGE_TYPE,

        RETENTION_CRON: process.env.RETENTION_CRON,

    },
});
