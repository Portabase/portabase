import {NextResponse} from "next/server";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {jobLogsResponse} from "@/lib/api-v1/services/job-logs";

const log = logger.child({module: "api/v1/databases/[id]/restore/[restorationId]/logs"});

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;
            return await jobLogsResponse("restoration", guard.data.id, params?.restorationId);
        } catch (error) {
            log.error({error}, "Error in GET restoration logs");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
