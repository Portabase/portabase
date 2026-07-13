import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";

const log = logger.child({ module: "api/v1/databases/[id]" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
      try {
        const guard = await requireDatabaseAccess(params, ctx.user);

        if (!guard.ok) {
          return guard.response;
        }

        const { id } = guard.data;

        const database = await db.query.database.findFirst({
          where: and(
              eq(drizzleDb.schemas.database.id, id),
              isNull(drizzleDb.schemas.database.deletedAt)
          ),
        });

        if (!database) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({ data: database });
      } catch (error) {
        log.error({ error }, "Error in GET /api/v1/databases/[id]");

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
      }
    }
);