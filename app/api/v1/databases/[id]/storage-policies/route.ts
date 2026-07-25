import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireDatabaseAccess } from "@/lib/api-v1/services/databases";
import {
  createStoragePolicy,
  isChannelInDatabaseOrg,
  listStoragePolicies,
  storagePolicyExists,
} from "@/lib/api-v1/services/policies";

const log = logger.child({ module: "api/v1/databases/[id]/storage-policies" });

export const GET = withApiKey(
  async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const data = await listStoragePolicies(guard.data.id);
      return NextResponse.json({ data });
    } catch (error) {
      log.error({ error }, "Error in GET storage-policies");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);

const CreateStoragePolicySchema = z.object({
  storageChannelId: z.string().uuid("storageChannelId must be a valid UUID"),
  enabled: z.boolean().optional(),
});

export const POST = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const body = await parseJsonBody(req, CreateStoragePolicySchema);
      if (!body.ok) return body.response;

      if (!(await isChannelInDatabaseOrg(guard.data.id, body.data.storageChannelId))) {
        return NextResponse.json(
          { error: "Storage channel does not belong to the database's organization" },
          { status: 422 }
        );
      }

      if (await storagePolicyExists(guard.data.id, body.data.storageChannelId)) {
        return NextResponse.json({ error: "Storage policy already exists" }, { status: 409 });
      }

      const created = await createStoragePolicy({
        databaseId: guard.data.id,
        storageChannelId: body.data.storageChannelId,
        enabled: body.data.enabled ?? true,
      });

      return NextResponse.json({ data: created }, { status: 201 });
    } catch (error) {
      log.error({ error }, "Error in POST storage-policies");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
