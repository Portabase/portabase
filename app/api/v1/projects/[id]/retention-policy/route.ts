import {NextResponse} from "next/server";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";
import {requireOrg} from "@/lib/api-v1/services/organizations";
import {requireProjectAccess} from "@/lib/api-v1/services/projects";
import {RetentionSettingsSchema} from "@/features/database/schemas/retention-policy.schema";
import {upsertRetentionPolicyService} from "@/features/database/services/retention-policy.service";

const log = logger.child({module: "api/v1/projects/[id]/retention-policy"});

export const PUT = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireProjectAccess(ctx, params?.id);
            if (!guard.ok) return guard.response;

            const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
            if (!org.ok) return org.response;

            const body = await parseJsonBody(req, RetentionSettingsSchema);
            if (!body.ok) return body.response;

            if (!guard.data.project.backupPolicy) {
                return NextResponse.json(
                    {error: "Set a backup schedule on this project first"},
                    {status: 409}
                );
            }

            const policy = await upsertRetentionPolicyService({type: "project", id: guard.data.project.id}, body.data);
            return NextResponse.json({data: policy});
        } catch (error) {
            log.error({error}, "Error in PUT project retention-policy");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
