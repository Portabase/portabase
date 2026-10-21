"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {fetchWithHttpProxy} from "@/lib/http-proxy";
import {getSettings} from "@/db/services/setting";


export const googleDriveRefreshTokenAction = userAction.inputSchema(
    z.object({
        code: z.string(),
        clientId: z.string(),
        clientSecret: z.string(),
        redirectUri: z.string(),
    })).action(async ({parsedInput}): Promise<ServerActionResult<string>> => {
        const {code, clientId, clientSecret, redirectUri} = parsedInput;

        try {

            const settings = await getSettings();
            const tokenRes = await fetchWithHttpProxy("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri,
                }),
            }, settings?.httpProxy);

            const tokens = await tokenRes.json();

            return {
                success: true,
                value: tokens.refresh_token,
                actionSuccess: {
                    message: "Refresh token successfully fetched",
                    messageParams: {code: code},
                },
            };
        }catch {
            return {
                success: false,
                actionError: {
                    message: "An error occurred",
                    status: 404,
                    messageParams: {code: code},
                },
            };
        }


});
