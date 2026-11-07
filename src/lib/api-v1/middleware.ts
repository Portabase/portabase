import { NextResponse } from "next/server";
import { API_KEY_ERROR_CODES, defaultKeyHasher } from "@better-auth/api-key";
import { auth } from "@/lib/auth/auth";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";
import {db} from "@/db";
import {computeSystemPermissions} from "@/lib/acl/system-acl";
import {ApiKeyContext} from "@/lib/api-v1/types";

const log = logger.child({ module: "api-v1/middleware" });

type ApiKeyHandler = (
  req: Request,
  ctx: ApiKeyContext,
  params?: Record<string, string>
) => Promise<Response>;

type ApiKeyQuota = Pick<
  typeof drizzleDb.schemas.apikey.$inferSelect,
  "remaining" | "refillAmount" | "refillInterval" | "lastRefillAt" | "createdAt"
>;

function rateLimitQuota(apiKey?: ApiKeyQuota) {
  if (!apiKey?.refillAmount || !apiKey.refillInterval) return null;
  const resetAt = new Date(apiKey.lastRefillAt ?? apiKey.createdAt).getTime() + apiKey.refillInterval;
  return {
    tryAgainIn: Math.max(0, resetAt - Date.now()),
    headers: {
      "X-RateLimit-Limit": String(apiKey.refillAmount),
      "X-RateLimit-Remaining": String(apiKey.remaining ?? 0),
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    },
  };
}

export function withApiKey(handler: ApiKeyHandler) {
  return async (
    req: Request,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    try {
      const key = req.headers.get("x-api-key");
      if (!key) {
        return NextResponse.json(
          { error: "Missing API key" },
          { status: 401 }
        );
      }

      // @ts-ignore - verifyApiKey is added by the @better-auth/api-key plugin
      const result = await auth.api.verifyApiKey({ body: { key, configId: "standard" } });

      if (!result?.valid || !result?.key) {

        if (result.error?.code === "USAGE_EXCEEDED") {
          const quota = rateLimitQuota(
            await db.query.apikey.findFirst({
              where: eq(drizzleDb.schemas.apikey.key, await defaultKeyHasher(key)),
            })
          );
          return NextResponse.json(
            { error: API_KEY_ERROR_CODES.RATE_LIMIT_EXCEEDED.message, details: { tryAgainIn: quota?.tryAgainIn ?? null } },
            {
              status: 429,
              headers: quota ? { ...quota.headers, "Retry-After": String(Math.ceil(quota.tryAgainIn / 1000)) } : undefined,
            }
          );
        }
        return NextResponse.json(
          { error: "Invalid or expired API key" },
          { status: 401 }
        );
      }

      const userId = result.key.referenceId as string;

      if (!userId) {
        return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
      }

      const memberships = await drizzleDb.db.query.member.findMany({
        where: eq(drizzleDb.schemas.member.userId, userId),
        with: {
          user: true
        }
      });

      const organizations = await Promise.all(
          memberships.map(async (m) => {
            return {
              id: m.organizationId,
              permissions:  computeOrganizationPermissions(m),
            };
          })
      );

      const userFetched = await db.query.user.findFirst({
        where: eq(drizzleDb.schemas.user.id, userId),
      })


      if (!userFetched) {
        return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
      }

      if (userFetched.banned) {
        return NextResponse.json({ error: "Account suspended" }, { status: 403 });
      }

      if (userFetched.role === "pending") {
        return NextResponse.json({ error: "Account pending approval" }, { status: 403 });
      }

      const userPermissions = computeSystemPermissions(userFetched)

      const user = {
        id: userFetched.id,
        permissions: userPermissions,
      }

      const resolvedParams = context?.params ? await context.params : {};

      const response = await handler(req, { user, organizations }, resolvedParams);
      for (const [name, value] of Object.entries(rateLimitQuota(result.key)?.headers ?? {})) {
        response.headers.set(name, value);
      }
      return response;
    } catch (err) {
      log.error({ error: err }, "Error in withApiKey middleware");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
