import {ApiHttpClient} from "./http-client";
import {env} from "@/env.mjs";


export async function signInDefaultUser(client: ApiHttpClient) {
    const email = env.AUTH_DEFAULT_USER;
    const password = env.AUTH_DEFAULT_PASSWORD;

    if (!email || !password) throw new Error("AUTH_DEFAULT_USER and AUTH_DEFAULT_PASSWORD are required");

    const result = await client.request("POST", "/api/auth/sign-in/email", {
        email,
        password,
        callbackURL: "/dashboard",
    });

    if (!result.response.ok) {
        throw new Error(`Sign-in failed: ${result.response.status} ${result.text}`);
    }

    const cookie = client.getCookieHeader();
    if (!cookie) {
        throw new Error("Sign-in succeeded but no auth cookie was captured");
    }

    return {
        email,
        cookie,
    };
}

export async function createStandardApiKey(client: ApiHttpClient) {
    const result = await client.request("POST", "/api/auth/api-key/create", {
        name: "api-test-key",
        configId: "standard",
    });

    if (!result.response.ok) {
        throw new Error(
            `API key creation failed: ${result.response.status} ${result.text}`,
        );
    }

    const payload = result.json as { key?: string };
    if (!payload?.key) {
        throw new Error(`API key payload missing key: ${result.text}`);
    }

    return payload.key;
}
