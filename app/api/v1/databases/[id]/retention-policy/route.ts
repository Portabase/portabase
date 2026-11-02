import {NextResponse} from "next/server";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {RetentionSettingsSchema} from "@/features/database/schemas/retention-policy.schema";
import {upsertRetentionPolicyService} from "@/features/database/services/retention-policy.service";

const log = logger.child({module: "api/v1/databases/[id]/retention-policy"});

export const PUT = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;

            const body = await parseJsonBody(req, RetentionSettingsSchema);
            if (!body.ok) return body.response;

            const database = await db.query.database.findFirst({
                where: and(
                    eq(drizzleDb.schemas.database.id, guard.data.id),
                    isNull(drizzleDb.schemas.database.deletedAt)
                ),
                columns: {backupPolicy: true},
            });
            if (!database?.backupPolicy) {
                return NextResponse.json(
                    {error: "Set a backup schedule on this database first"},
                    {status: 409}
                );
            }

            const policy = await upsertRetentionPolicyService({type: "database", id: guard.data.id}, body.data);
            return NextResponse.json({data: policy});
        } catch (error) {
            log.error({error}, "Error in PUT database retention-policy");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
