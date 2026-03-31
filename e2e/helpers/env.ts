const REQUIRED_E2E_ENV_VARS = [
    "E2E_NOTIFICATION_SMTP_HOST",
    "E2E_NOTIFICATION_SMTP_PORT",
    "E2E_NOTIFICATION_SMTP_USER",
    "E2E_NOTIFICATION_SMTP_PASSWORD",
    "E2E_NOTIFICATION_SMTP_FROM",
    "E2E_NOTIFICATION_SMTP_TO",
    "E2E_NOTIFICATION_SLACK_WEBHOOK",
    "E2E_NOTIFICATION_DISCORD_WEBHOOK",
    "E2E_NOTIFICATION_TELEGRAM_BOT_TOKEN",
    "E2E_NOTIFICATION_TELEGRAM_CHAT_ID",
    "E2E_NOTIFICATION_TELEGRAM_TOPIC_ID",
    "E2E_NOTIFICATION_GOTIFY_SERVER_URL",
    "E2E_NOTIFICATION_GOTIFY_APP_TOKEN",
    "E2E_NOTIFICATION_NTFY_TOPIC",
    "E2E_NOTIFICATION_NTFY_SERVER_URL",
    "E2E_NOTIFICATION_NTFY_TOKEN",
    "E2E_NOTIFICATION_NTFY_USERNAME",
    "E2E_NOTIFICATION_NTFY_PASSWORD",
    "E2E_NOTIFICATION_WEBHOOK_URL",
    "E2E_NOTIFICATION_WEBHOOK_SECRET_HEADER",
    "E2E_NOTIFICATION_WEBHOOK_SECRET",
    "E2E_STORAGE_AWS_S3_ENDPOINT_URL",
    "E2E_STORAGE_AWS_S3_REGION",
    "E2E_STORAGE_AWS_S3_ACCESS_KEY",
    "E2E_STORAGE_AWS_S3_SECRET_KEY",
    "E2E_STORAGE_AWS_S3_BUCKET_NAME",
    "E2E_STORAGE_AWS_S3_PORT",
    "E2E_STORAGE_R2_ENDPOINT_URL",
    "E2E_STORAGE_R2_REGION",
    "E2E_STORAGE_R2_ACCESS_KEY",
    "E2E_STORAGE_R2_SECRET_KEY",
    "E2E_STORAGE_R2_BUCKET_NAME",
    "E2E_STORAGE_R2_PORT",
    "E2E_STORAGE_GOOGLE_DRIVE_CLIENT_ID",
    "E2E_STORAGE_GOOGLE_DRIVE_CLIENT_SECRET",
    "E2E_STORAGE_GOOGLE_DRIVE_FOLDER_ID",
] as const;

function assertRequiredEnvVars() {
    const missingVars = REQUIRED_E2E_ENV_VARS.filter((name) => {
        const value = process.env[name]?.trim();
        return !value;
    });

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missingVars.map((name) => `- ${name}`).join("\n")}`,
        );
    }
}

assertRequiredEnvVars();

export function getEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}
