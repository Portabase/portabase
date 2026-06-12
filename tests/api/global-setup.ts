import {writeContext} from "./helpers/context";
import {ApiHttpClient} from "./helpers/http-client";
import {signInDefaultUser, createStandardApiKey} from "./helpers/auth";
import {discoverAgentId, discoverBackupContext, discoverDatabaseId,} from "./helpers/discovery";
import {env} from "@/env.mjs";

export default async function globalSetup() {
    const baseUrl = env.PROJECT_URL;

    const client = new ApiHttpClient(baseUrl);

    const auth = await signInDefaultUser(client);
    const apiKey = await createStandardApiKey(client);
    const api = client.withApiKey(apiKey);

    const agentId = await discoverAgentId(api);
    const databaseId = await discoverDatabaseId(api);
    const backup = await discoverBackupContext(api, databaseId);

    writeContext({
        baseUrl,
        authCookie: client.getCookieHeader(),
        apiKey,
        userEmail: auth.email,
        agentId,
        databaseId,
        backupId: backup.backupId,
        backupStorageId: backup.backupStorageId,
    });
}
