import {NextResponse} from "next/server";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {
    checkRestorableBackup,
    findDatabaseRestoration,
    hasActiveRestoration,
} from "@/lib/api-v1/services/restorations";
import {rerunRestorationService} from "@/features/database/services/restoration.service";

const log = logger.child({module: "api/v1/databases/[id]/restore/[restorationId]/rerun"});

export const POST = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;

            const restoration = await findDatabaseRestoration(guard.data.id, params?.restorationId);
            if (!restoration) return NextResponse.json({error: "Restoration not found"}, {status: 404});

            if (await hasActiveRestoration(guard.data.id)) {
                return NextResponse.json(
                    {error: "A restoration is already waiting or ongoing for this database"},
                    {status: 409}
                );
            }

            const restorable = await checkRestorableBackup(guard.data.id, restoration.backupId, restoration.backupStorageId);
            if (!restorable.ok) return restorable.response;

            const updated = await rerunRestorationService(restoration.id);
            return NextResponse.json({data: updated});
        } catch (error) {
            log.error({error}, "Error in POST restoration rerun");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
