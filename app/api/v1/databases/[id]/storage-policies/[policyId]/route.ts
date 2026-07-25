import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireDatabaseAccess } from "@/lib/api-v1/services/databases";
import { deleteStoragePolicy, updateStoragePolicy } from "@/lib/api-v1/services/policies";

const log = logger.child({ module: "api/v1/databases/[id]/storage-policies/[policyId]" });

const UpdateStoragePolicySchema = z.object({ enabled: z.boolean() });

export const PATCH = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const policyId = params?.policyId;
      if (!policyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const body = await parseJsonBody(req, UpdateStoragePolicySchema);
      if (!body.ok) return body.response;

      const updated = await updateStoragePolicy(guard.data.id, policyId, body.data.enabled);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: updated });
    } catch (error) {
      log.error({ error }, "Error in PATCH storage-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

export const DELETE = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const policyId = params?.policyId;
      if (!policyId) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const removed = await deleteStoragePolicy(guard.data.id, policyId);
      if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: { id: policyId } });
    } catch (error) {
      log.error({ error }, "Error in DELETE storage-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
