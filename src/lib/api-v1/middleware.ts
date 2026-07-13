import { NextResponse } from "next/server";
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

      // @ts-ignore — verifyApiKey is added by the @better-auth/api-key plugin
      const result = await auth.api.verifyApiKey({ body: { key, configId: "standard" } });

      if (!result?.valid || !result?.key) {

        if (result.error?.code === "RATE_LIMITED") {
          return NextResponse.json(
            { error: result.error.message, details: (result.error as any).details ?? null },
            { status: 429 }
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
        throw new Error("Unable to find user")
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

      return handler(req, { user, organizations }, resolvedParams);
    } catch (err) {
      log.error({ error: err }, "Error in withApiKey middleware");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
