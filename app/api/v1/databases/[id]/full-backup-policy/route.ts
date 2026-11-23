import {NextResponse} from "next/server";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";
import {requireDatabaseAccess, stripDatabaseConfigForApi} from "@/lib/api-v1/services/databases";
import {setFullBackupCron} from "@/features/database/services/physical-chain.service";

const log = logger.child({module: "api/v1/databases/[id]/full-backup-policy"});

const FullBackupPolicySchema = z.object({
    fullBackupPolicy: z.string(),
});

export const PUT = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;

            const body = await parseJsonBody(req, FullBackupPolicySchema);
            if (!body.ok) return body.response;

            const database = await db.query.database.findFirst({
                where: eq(drizzleDb.schemas.database.id, guard.data.id),
                columns: {backupEngine: true},
            });
            if (database?.backupEngine !== "physical") {
                return NextResponse.json(
                    {error: "A full backup schedule only applies to a source using the physical method"},
                    {status: 422}
                );
            }

            const result = await setFullBackupCron(guard.data.id, body.data.fullBackupPolicy);
            if (!result.ok) return NextResponse.json({error: result.error}, {status: 422});

            return NextResponse.json({data: stripDatabaseConfigForApi(result.database)});
        } catch (error) {
            log.error({error}, "Error in PUT full-backup-policy");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
