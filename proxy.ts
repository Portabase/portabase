import { NextRequest, NextResponse } from "next/server";
import { loggingMiddleware } from "@/middleware/loggingMiddleware";
import { errorHandler } from "@/middleware/errorHandler";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { env } from "@/env.mjs";
import {User} from "@/db/schema/02_user";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const redirectUrl = encodeURIComponent(request.nextUrl.pathname);

  if (url.pathname.startsWith("/dashboard")) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?redirect=${redirectUrl}`, request.url),
      );
    }
    const user = session.user as User

    if (user.banned) {
      await auth.api.signOut({ headers: await headers() });
      return NextResponse.redirect(new URL("/login?error=banned", request.url));
    }
    if (user.role === "pending") {
      await auth.api.signOut({ headers: await headers() });
      return NextResponse.redirect(
        new URL(`/login?error=pending?redirect=${redirectUrl}`, request.url),
      );
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
    if (url.pathname.startsWith("/api/v1")) {
      const apiEnabled = String(env.API_ENABLED) === "true";
      if (!apiEnabled) {
        return new NextResponse(
          JSON.stringify({
            message: "This API route does not exist.",
            status: 404,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      const openapiEnabled = String(env.OPENAPI_ENABLED) === "true";
      if (
        !openapiEnabled &&
        (url.pathname.startsWith("/api/v1/docs") ||
          url.pathname.startsWith("/api/v1/openapi"))
      ) {
        return new NextResponse(
          JSON.stringify({
            message: "This API route does not exist.",
            status: 404,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const routeExists = checkRouteExists(url.pathname);
    if (!routeExists) {
      return new NextResponse(
        JSON.stringify({
          message: "This API route does not exist.",
          status: 404,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
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
    /^\/api\/agent\/[^/]+\/backup\/upload\/init\/?$/,
    /^\/api\/agent\/[^/]+\/backup\/upload\/status\/?$/,
    /^\/api\/agent\/[^/]+\/restore\/?$/,
    /^\/api\/files\/images\/[^/]+\/?$/,
    /^\/api\/files\/backups\/?$/,
    /^\/api\/tus\/hooks\/?$/,
    /^\/api\/events\/?$/,
    /^\/api\/config\/?$/,
    /^\/api\/health\/?$/,
    /^\/api\/google\/drive\/callback\/?$/,
    // v1 external API
    /^\/api\/v1\/mcp\/?$/,
    /^\/api\/v1\/docs\/?$/,
    /^\/api\/v1\/openapi\/?$/,
    /^\/api\/v1\/agents\/?$/,
    /^\/api\/v1\/agents\/[^/]+\/?$/,
    /^\/api\/v1\/agents\/[^/]+\/key\/?$/,
    /^\/api\/v1\/databases\/?$/,
    /^\/api\/v1\/databases\/[^/]+\/?$/,
    /^\/api\/v1\/databases\/[^/]+\/backup\/?$/,
    /^\/api\/v1\/databases\/[^/]+\/backup\/[^/]+\/?$/,
    /^\/api\/v1\/databases\/[^/]+\/restore\/?$/,
    /^\/api\/v1\/databases\/[^/]+\/status\/?$/,
  ];
  return routePatterns.some((pattern) => pattern.test(pathname));
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/dashboard"],
};
