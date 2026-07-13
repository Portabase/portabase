import { NextResponse } from "next/server";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { getAccessibleDatabases } from "@/lib/api-v1/services/databases";

const log = logger.child({ module: "api/v1/databases" });

export const GET = withApiKey(async (_req: Request, ctx: ApiKeyContext) => {
  try {
    const databases = await getAccessibleDatabases(ctx.user);

    return NextResponse.json({
      data: databases,
    });
  } catch (error) {
    log.error({ error }, "Error in GET /api/v1/databases");

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
});