import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireDatabaseAccess } from "@/lib/api-v1/services/databases";
import {
  deleteRetentionPolicy,
  getRetentionPolicy,
  upsertRetentionPolicy,
} from "@/lib/api-v1/services/policies";

const log = logger.child({ module: "api/v1/databases/[id]/retention-policy" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const policy = await getRetentionPolicy(guard.data.id);
      if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: policy });
    } catch (error) {
      log.error({ error }, "Error in GET retention-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const RetentionSchema = z
  .object({
    type: z.enum(["count", "days", "gfs"]),
    count: z.number().int().positive().optional(),
    days: z.number().int().positive().optional(),
    gfsDaily: z.number().int().positive().optional(),
    gfsWeekly: z.number().int().positive().optional(),
    gfsMonthly: z.number().int().positive().optional(),
    gfsYearly: z.number().int().positive().optional(),
  })
  .refine((v) => (v.type === "count" ? v.count !== undefined : true), {
    message: "count is required when type is 'count'",
  })
  .refine((v) => (v.type === "days" ? v.days !== undefined : true), {
    message: "days is required when type is 'days'",
  });

export const PUT = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const body = await parseJsonBody(req, RetentionSchema);
      if (!body.ok) return body.response;

      const policy = await upsertRetentionPolicy(guard.data.id, body.data);
      return NextResponse.json({ data: policy });
    } catch (error) {
      log.error({ error }, "Error in PUT retention-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const removed = await deleteRetentionPolicy(guard.data.id);
      if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: { databaseId: guard.data.id } });
    } catch (error) {
      log.error({ error }, "Error in DELETE retention-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
