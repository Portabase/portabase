import {NextResponse} from "next/server";
import {z} from "zod";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";
import {backupScheduleInput} from "@/lib/api-v1/validation/cron";
import {requireOrg} from "@/lib/api-v1/services/organizations";
import {requireProjectAccess} from "@/lib/api-v1/services/projects";
import {updateBackupPolicyService} from "@/features/database/actions/cron.action";

const log = logger.child({module: "api/v1/projects/[id]/backup-policy"});

const BackupPolicySchema = z.object({
    backupPolicy: backupScheduleInput,
});

export const PUT = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireProjectAccess(ctx, params?.id);
            if (!guard.ok) return guard.response;

            const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
            if (!org.ok) return org.response;

            const body = await parseJsonBody(req, BackupPolicySchema);
            if (!body.ok) return body.response;

            const updated = await updateBackupPolicyService(
                {type: "project", id: guard.data.project.id},
                body.data.backupPolicy
            );
            return NextResponse.json({data: updated});
        } catch (error) {
            log.error({error}, "Error in PUT project backup-policy");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
