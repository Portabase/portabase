import {NextRequest, NextResponse} from "next/server";
import {loggingMiddleware} from "@/middleware/loggingMiddleware";
import {errorHandler} from "@/middleware/errorHandler";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";

export async function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const redirectUrl = encodeURIComponent(request.nextUrl.pathname)

    if (url.pathname.startsWith("/dashboard")) {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
        }
        if (session.user.banned) {
            await auth.api.signOut({headers: await headers()});
            return NextResponse.redirect(new URL("/login?error=banned", request.url));
        }
        if (session.user.role === "pending") {
            await auth.api.signOut({headers: await headers()});
            return NextResponse.redirect(new URL(`/login?error=pending?redirect=${redirectUrl}`, request.url));
        }
        if (url.pathname === "/dashboard") {
            return NextResponse.redirect(new URL(`/dashboard/home`, request.url));
        }
        return NextResponse.next();
    }

    if (url.pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    if (url.pathname.startsWith("/api")) {
        const routeExists = checkRouteExists(url.pathname);
        if (!routeExists) {
            return new NextResponse(JSON.stringify({message: "This API route does not exist.", status: 404}), {
                status: 404,
                headers: {"Content-Type": "application/json"},
            });
        }
    }
    try {
        loggingMiddleware(request);
    } catch (err) {
        errorHandler(err);
    }
}

function checkRouteExists(pathname: string) {
    const routePatterns = [
        /^\/api\/agent\/[^/]+\/status\/?$/,
        /^\/api\/agent\/[^/]+\/backup\/?$/,
        /^\/api\/agent\/[^/]+\/restore\/?$/,
        /^\/api\/files\/images\/[^/]+\/?$/,
        /^\/api\/files\/backups\/?$/,
        /^\/api\/events\/?$/,
        /^\/api\/init\/?$/,
        /^\/api\/config\/?$/,
        /^\/api\/google\/drive\/callback\/?$/,
    ];
    return routePatterns.some((pattern) => pattern.test(pathname));
}

export const config = {
    matcher: [
        "/api/:path*",
        "/dashboard/:path*",
        "/dashboard",
    ]
};
