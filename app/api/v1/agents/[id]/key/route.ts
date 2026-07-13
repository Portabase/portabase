import {withApiKey} from "@/lib/api-v1/middleware";
import {ApiKeyContext} from "@/lib/api-v1/types";
import {NextResponse} from "next/server";
import {getAgent, resolveAgentAccess} from "@/lib/api-v1/services/agents";
import {logger} from "@/lib/logger";
import {generateEdgeKey} from "@/utils/edge_key";
import {getServerUrl} from "@/utils/get-server-url";

const log = logger.child({ module: "api/v1/agents/[id]/key" });

export const GET = withApiKey(
    async (_req: Request, ctx: ApiKeyContext, params?: Record<string, string>) => {
        try {
            const id = params?.id;
            if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

            const access = await resolveAgentAccess(id, ctx.user);

            if (access === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            if (access === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });

            const agent = await getAgent(id);

            if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

            const edgeKey = await generateEdgeKey(getServerUrl(), agent.id);

            return NextResponse.json({ data: edgeKey });
        } catch (error) {
            log.error({ error }, "Error in GET /api/v1/agents/[id]");
            return NextResponse.json({ error: "Internal server error" }, { status: 500 });
        }
    }
);