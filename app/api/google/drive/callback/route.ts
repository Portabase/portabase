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
