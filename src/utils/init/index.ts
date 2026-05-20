import { env } from "@/env.mjs";
import { makeMigration } from "@/db";
import { generateRSAKeys, getOrCreateMasterKey } from "@/utils/rsa-keys";
import {logger} from "@/lib/logger";
import {setupCronJobs} from "@/utils/init/cron";
import {createSettingsIfNotExist} from "@/utils/init/setting";
import {createDefaultOrganization} from "@/utils/init/organization";
import {createDefaultUser} from "@/utils/init/user";

const log = logger.child({module: "init"});

export async function init() {
    consoleAscii();
    log.info("====Init Functions====");
    await getOrCreateMasterKey();
    await generateRSAKeys();
    await makeMigration();
    await createDefaultOrganization();
    await createSettingsIfNotExist();
    await createDefaultUser();
    log.info("====Initialization completed====");
    await setupCronJobs();
    if (
        (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) ||
        (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET)
    ) {
        log.warn(
            {
                deprecated: true,
                provider: "oauth_env",
                message: "You have set up OAuth credentials in your environment variables, but the format is now different. Please update your environment variables to use the new format. For example, if you were using AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, you should now use AUTH_SOCIAL_GOOGLE_CLIENT and AUTH_SOCIAL_GOOGLE_SECRET. Please refer to the documentation for more details. (https://portabase.io/docs/dashboard/auth/oauth2/setup#dynamic-providers)"
            },
            "Deprecated OAuth environment variables detected",
        );
    }
}

function consoleAscii() {
    console.log(
        "                                                          \n" +
        "     ____             __        __                        \n" +
        "    / __ \\____  _____/ /_____ _/ /_  ____ _________       \n" +
        "   / /_/ / __ \\/ ___/ __/ __  / __ \\/ __  / ___/ _ \\      \n" +
        "  / ____/ /_/ / /  / /_/ /_/ / /_/ / /_/ (__  )  __/           \n" +
        " /_/    \\____/_/   \\__/\\__,_/_.___/\\__,_/____/\\___/       \n" +
        "                                                          \n" +
        ` Community Edition v${env.NEXT_PUBLIC_PROJECT_VERSION}   \n ` +
        "                                                          \n",
    );
}
