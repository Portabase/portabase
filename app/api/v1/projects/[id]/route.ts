import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withApiKey} from "@/lib/api-v1/middleware";
import {logger} from "@/lib/logger";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {requireOrg} from "@/lib/api-v1/services/organizations";
import {requireProjectAccess} from "@/lib/api-v1/services/projects";
import {archiveProjectService} from "@/features/projects/actions/project-delete.action";

const log = logger.child({module: "api/v1/projects/[id]"});

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireProjectAccess(ctx, params?.id);
            if (!guard.ok) return guard.response;
            const project = await db.query.project.findFirst({
                where: eq(drizzleDb.schemas.project.id, guard.data.project.id),
                with: {retentionPolicy: true},
            });
            return NextResponse.json({data: project});
        } catch (error) {
            log.error({error}, "Error in GET /api/v1/projects/[id]");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);

export const DELETE = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const guard = await requireProjectAccess(ctx, params?.id);
            if (!guard.ok) return guard.response;

            const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
            if (!org.ok) return org.response;

            const archived = await archiveProjectService(guard.data.project.id);
            return NextResponse.json({data: archived});
        } catch (error) {
            log.error({error}, "Error in DELETE /api/v1/projects/[id]");
            return NextResponse.json({error: "Internal server error"}, {status: 500});
        }
    }
);
