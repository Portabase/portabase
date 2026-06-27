import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const authHandler = toNextJsHandler(auth.handler);

async function blockApiKeyCreateForRestrictedUsers(
  req: NextRequest,
): Promise<NextResponse | null> {
  const url = req.nextUrl;
  if (req.method !== "POST" || !url.pathname.endsWith("/api-key/create")) {
    return null;
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }
  // @ts-ignore
  if (session.user.banned || (session.user.role as string) === "pending") {
    return NextResponse.json(
      { error: "Account not eligible to create API keys" },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  return authHandler.GET(req);
}

export async function POST(req: NextRequest) {
  const guard = await blockApiKeyCreateForRestrictedUsers(req);
  if (guard) return guard;
  return authHandler.POST(req);
}
