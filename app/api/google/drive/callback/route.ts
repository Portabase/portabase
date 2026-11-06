import {GOOGLE_DRIVE_OAUTH_CHANNEL} from "@/features/channel/components/storages/google-drive/google-drive-oauth-channel";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    const success = Boolean(code);

    return new Response(
        `
        <!DOCTYPE html>
        <html>
            <body>
                <h1>${success ? "Success" : "Failed"}</h1>
                <script>
                    const params = new URLSearchParams(window.location.search);
                    const channel = new BroadcastChannel(${JSON.stringify(GOOGLE_DRIVE_OAUTH_CHANNEL)});
                    channel.postMessage({code: params.get("code"), error: params.get("error")});
                    channel.close();
                    window.close();
                </script>
            </body>
        </html>
        `,
        {
            status: success ? 200 : 400,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        }
    );
}
