import {NextResponse} from "next/server";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {findDatabaseRestoration} from "@/lib/api-v1/services/restorations";
import {deleteRestorationService} from "@/features/database/services/restoration.service";

const log = logger.child({module: "api/v1/databases/[id]/restore/[restorationId]"});

export const DELETE = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;

            const restoration = await findDatabaseRestoration(guard.data.id, params?.restorationId);
            if (!restoration) return NextResponse.json({error: "Restoration not found"}, {status: 404});

            await deleteRestorationService(restoration.id);
            return new Response(null, {status: 204});
        } catch (error) {
            log.error({error}, "Error in DELETE restoration");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
