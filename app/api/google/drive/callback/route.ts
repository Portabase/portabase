import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const clientId = url.searchParams.get("clientId");
        const clientSecret = url.searchParams.get("clientSecret");
        const redirectUri = url.searchParams.get("redirectUri");

        if (!code || !clientId || !clientSecret || !redirectUri) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        try {
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
            const { tokens } = await oauth2Client.getToken(code);

            // Save tokens.refresh_token securely in your DB here

            return NextResponse.json(tokens);
        } catch (err: any) {
            console.error("Error exchanging code:", err);
            return NextResponse.json({ error: "Failed to exchange code" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in GET handler:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
