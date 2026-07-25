import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/lib/api-v1/middleware";
import { logger } from "@/lib/logger";
import { ApiKeyContext } from "@/lib/api-v1/types";
import { parseJsonBody } from "@/lib/api-v1/validation/json-body";
import { requireDatabaseAccess } from "@/lib/api-v1/services/databases";
import { setBackupPolicy } from "@/lib/api-v1/services/policies";

const log = logger.child({ module: "api/v1/databases/[id]/backup-policy" });

const BackupPolicySchema = z.object({
  schedule: z.string().min(1).nullable(),
});

export const PUT = withApiKey(
  async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
    try {
      const guard = await requireDatabaseAccess(params, ctx.user);
      if (!guard.ok) return guard.response;

      const body = await parseJsonBody(req, BackupPolicySchema);
      if (!body.ok) return body.response;

      const updated = await setBackupPolicy(guard.data.id, body.data.schedule);
      return NextResponse.json({ data: updated });
    } catch (error) {
      log.error({ error }, "Error in PUT backup-policy");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
