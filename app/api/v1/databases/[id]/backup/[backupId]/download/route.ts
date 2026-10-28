import {NextResponse} from "next/server";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {isUuid} from "@/lib/api-v1/validation/uuid";
import {getBackupDownloadUrlService} from "@/features/database/services/backup-download.service";

const log = logger.child({module: "api/v1/databases/[id]/backup/[backupId]/download"});

export const GET = withApiKey(
    async (req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireDatabaseAccess(params, ctx.user);
            if (!guard.ok) return guard.response;

            const backupStorageId = new URL(req.url).searchParams.get("backupStorageId") ?? undefined;
            if (!isUuid(backupStorageId)) {
                return NextResponse.json({error: "backupStorageId must be a valid UUID"}, {status: 422});
            }

            const backupId = params?.backupId;
            const backupStorage = isUuid(backupId)
                ? await db.query.backupStorage.findFirst({
                    where: and(
                        eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
                        eq(drizzleDb.schemas.backupStorage.backupId, backupId),
                        isNull(drizzleDb.schemas.backupStorage.deletedAt)
                    ),
                    with: {backup: {columns: {databaseId: true, deletedAt: true}}},
                })
                : undefined;
            if (!backupStorage || backupStorage.backup.databaseId !== guard.data.id || backupStorage.backup.deletedAt) {
                return NextResponse.json({error: "Backup storage not found."}, {status: 404});
            }

            const result = await getBackupDownloadUrlService(backupStorage.id);
            if (!result.ok) return NextResponse.json({error: result.error}, {status: result.status});

            return NextResponse.json({data: {url: result.url}});
        } catch (error) {
            log.error({error}, "Error in GET backup download");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
