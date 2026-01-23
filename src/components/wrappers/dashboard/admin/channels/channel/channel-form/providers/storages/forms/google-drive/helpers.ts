"use server"
import {userAction} from "@/lib/safe-actions/actions";

import {string, z} from "zod";
import {google} from "googleapis";


export const googleDriveRefreshTokenAction = userAction.schema(
    z.object({
        code: z.string(),
        clientId: z.string(),
        clientSecret: z.string(),
        redirectUri: z.string(),
    })).action(async ({parsedInput}) => {
    // google.auth.OAuth2
    // const oauth2Client = new google.auth.OAuth2(parsedInput.clientId,parsedInput.clientSecret, parsedInput.redirectUri);
    // const { tokens } = await oauth2Client.getToken(parsedInput.code);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: parsedInput.clientId,
            client_secret: parsedInput.clientSecret,
            code: parsedInput.code,
            grant_type: "authorization_code",
            redirect_uri: parsedInput.redirectUri,
        }),
    });

    console.log(tokenRes);

    const tokens = await tokenRes.json();
    console.log(tokens.refresh_token);

    return {
        refreshToken: tokens.refresh_token,
    };
});
