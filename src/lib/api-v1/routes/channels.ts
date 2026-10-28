import {and, inArray, isNull} from "drizzle-orm";
import {NextResponse} from "next/server";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {
    type ChannelKind,
    type ChannelPatch,
    countStoredCopies,
    createChannelService,
    deleteChannelService,
    getChannelOwner,
    getGlobalChannelSafe,
    getOrganizationChannelSafe,
    listGlobalChannelsSafe,
    listOrganizationChannelsSafe,
    setChannelOrganizationsService,
    testStoredChannelService,
    updateChannelService,
} from "@/features/channel/services/channel.service";
import {withApiKey} from "@/lib/api-v1/middleware";
import {requireOrg} from "@/lib/api-v1/services/organizations";
import type {ApiKeyContext} from "@/lib/api-v1/types";
import {
    ChannelPatchSchema,
    configSchemaFor,
    formSchemaFor,
    OrganizationIdsSchema,
} from "@/lib/api-v1/validation/channel";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";
import {isUuid} from "@/lib/api-v1/validation/uuid";
import {logger} from "@/lib/logger";

export type Params = Record<string, string> | undefined;
export type Handler = (req: Request, ctx: ApiKeyContext, params: Params) => Promise<Response>;
type Result<T> = { ok: true; data: T } | { ok: false; response: Response };

const log = logger.child({module: "api/v1/channels"});

export function jsonError(message: string, status: number) {
    return NextResponse.json({error: message}, {status});
}

export function handle(route: string, handler: Handler) {
    return withApiKey(async (req, ctx, params) => {
        try {
            return await handler(req, ctx, params);
        } catch (error) {
            const failure = (error ?? {}) as { name?: string; code?: string; cause?: { code?: string } };
            log.error({name: failure.name, code: failure.code ?? failure.cause?.code}, `Error in ${route}`);
            return jsonError("Internal server error", 500);
        }
    });
}

function segment(kind: ChannelKind) {
    return `${kind}-channels`;
}

function isSystemAdmin(ctx: ApiKeyContext) {
    return ctx.user.permissions.isAdmin || ctx.user.permissions.isSuperAdmin;
}

function organizationCapability(kind: ChannelKind) {
    return kind === "storage" ? "canManageStorages" : "canManageNotifications";
}

async function parsePatch(req: Request, kind: ChannelKind, provider: string): Promise<Result<ChannelPatch>> {
    const body = await parseJsonBody(req, ChannelPatchSchema);
    if (!body.ok) return body;
    const {config, ...rest} = body.data;
    if (config === undefined) return {ok: true, data: rest};
    const schema = configSchemaFor(kind, provider);
    if (!schema) return {ok: false, response: jsonError("Unknown provider", 422)};
    const parsed = schema.safeParse(config);
    if (!parsed.success) {
        return {ok: false, response: jsonError(parsed.error.issues[0]?.message ?? "Invalid config", 422)};
    }
    return {ok: true, data: {...rest, config: parsed.data}};
}

async function deleteRefusal(req: Request, kind: ChannelKind, id: string, provider: string): Promise<Response | null> {
    if (kind !== "storage") return null;
    if (provider === "local") return jsonError("Local storage channels can't be deleted", 409);
    if (new URL(req.url).searchParams.get("force") === "true") return null;
    const copies = await countStoredCopies(id);
    if (copies === 0) return null;
    return jsonError(
        `Channel holds ${copies} stored backup copies; deleting it removes them from Portabase (files stay in the storage). Retry with ?force=true.`,
        409,
    );
}

async function missingOrganization(ids: string[]): Promise<string | null> {
    if (ids.length === 0) return null;
    const {organization} = drizzleDb.schemas;
    const found = await db
        .select({id: organization.id})
        .from(organization)
        .where(and(inArray(organization.id, ids), isNull(organization.deletedAt)));
    const foundIds = new Set(found.map((row) => row.id));
    return ids.find((id) => !foundIds.has(id)) ?? null;
}

export function globalChannelRoutes(kind: ChannelKind) {
    const base = `/${segment(kind)}`;

    async function globalChannel(ctx: ApiKeyContext, params: Params): Promise<Result<{ id: string; provider: string }>> {
        if (!isSystemAdmin(ctx)) return {ok: false, response: jsonError("Forbidden", 403)};
        const id = params?.channelId;
        if (!isUuid(id)) return {ok: false, response: jsonError("Not found", 404)};
        const owner = await getChannelOwner(kind, id);
        if (!owner || owner.organizationId !== null) return {ok: false, response: jsonError("Not found", 404)};
        return {ok: true, data: {id, provider: owner.provider}};
    }

    return {
        list: handle(`GET ${base}`, async (_req, ctx) => {
            if (!isSystemAdmin(ctx)) return jsonError("Forbidden", 403);
            return NextResponse.json({data: await listGlobalChannelsSafe(kind)});
        }),

        create: handle(`POST ${base}`, async (req, ctx) => {
            if (!isSystemAdmin(ctx)) return jsonError("Forbidden", 403);
            const body = await parseJsonBody(req, formSchemaFor(kind));
            if (!body.ok) return body.response;
            const channel = await createChannelService(kind, null, body.data);
            return NextResponse.json({data: await getGlobalChannelSafe(kind, channel.id)}, {status: 201});
        }),

        get: handle(`GET ${base}/{id}`, async (_req, ctx, params) => {
            const target = await globalChannel(ctx, params);
            if (!target.ok) return target.response;
            return NextResponse.json({data: await getGlobalChannelSafe(kind, target.data.id)});
        }),

        patch: handle(`PATCH ${base}/{id}`, async (req, ctx, params) => {
            const target = await globalChannel(ctx, params);
            if (!target.ok) return target.response;
            const patch = await parsePatch(req, kind, target.data.provider);
            if (!patch.ok) return patch.response;
            await updateChannelService(kind, target.data.id, patch.data);
            return NextResponse.json({data: await getGlobalChannelSafe(kind, target.data.id)});
        }),

        remove: handle(`DELETE ${base}/{id}`, async (req, ctx, params) => {
            const target = await globalChannel(ctx, params);
            if (!target.ok) return target.response;
            const refusal = await deleteRefusal(req, kind, target.data.id, target.data.provider);
            if (refusal) return refusal;
            await deleteChannelService(kind, target.data.id);
            return new Response(null, {status: 204});
        }),

        test: handle(`POST ${base}/{id}/test`, async (_req, ctx, params) => {
            const target = await globalChannel(ctx, params);
            if (!target.ok) return target.response;
            return NextResponse.json({data: await testStoredChannelService(kind, target.data.id)});
        }),

        setOrganizations: handle(`PUT ${base}/{id}/organizations`, async (req, ctx, params) => {
            const target = await globalChannel(ctx, params);
            if (!target.ok) return target.response;
            const body = await parseJsonBody(req, OrganizationIdsSchema);
            if (!body.ok) return body.response;
            const organizationIds = [...new Set(body.data.organizationIds)];
            const missing = await missingOrganization(organizationIds);
            if (missing) return jsonError(`Organization not found: ${missing}`, 422);
            await setChannelOrganizationsService(kind, target.data.id, organizationIds);
            return NextResponse.json({data: {organizationIds}});
        }),
    };
}

export function organizationChannelRoutes(kind: ChannelKind) {
    const base = `/organizations/{id}/${segment(kind)}`;

    async function organization(ctx: ApiKeyContext, params: Params): Promise<Result<string>> {
        const guard = await requireOrg(ctx, isUuid(params?.id) ? params?.id : undefined, organizationCapability(kind));
        if (!guard.ok) return guard;
        return {ok: true, data: guard.data.orgId};
    }

    async function ownedChannel(
        ctx: ApiKeyContext,
        params: Params,
    ): Promise<Result<{ organizationId: string; id: string; provider: string }>> {
        const org = await organization(ctx, params);
        if (!org.ok) return org;
        const id = params?.channelId;
        if (!isUuid(id)) return {ok: false, response: jsonError("Not found", 404)};
        const channel = await getOrganizationChannelSafe(kind, org.data, id);
        if (!channel) return {ok: false, response: jsonError("Not found", 404)};
        if (!channel.owned) {
            return {ok: false, response: jsonError("Global channels are managed by an instance administrator", 403)};
        }
        return {ok: true, data: {organizationId: org.data, id, provider: channel.provider}};
    }

    return {
        list: handle(`GET ${base}`, async (_req, ctx, params) => {
            const org = await organization(ctx, params);
            if (!org.ok) return org.response;
            return NextResponse.json({data: await listOrganizationChannelsSafe(kind, org.data)});
        }),

        create: handle(`POST ${base}`, async (req, ctx, params) => {
            const org = await organization(ctx, params);
            if (!org.ok) return org.response;
            const body = await parseJsonBody(req, formSchemaFor(kind));
            if (!body.ok) return body.response;
            const channel = await createChannelService(kind, org.data, body.data);
            return NextResponse.json({data: await getOrganizationChannelSafe(kind, org.data, channel.id)}, {status: 201});
        }),

        get: handle(`GET ${base}/{channelId}`, async (_req, ctx, params) => {
            const org = await organization(ctx, params);
            if (!org.ok) return org.response;
            const id = params?.channelId;
            const channel = isUuid(id) ? await getOrganizationChannelSafe(kind, org.data, id) : null;
            if (!channel) return jsonError("Not found", 404);
            return NextResponse.json({data: channel});
        }),

        patch: handle(`PATCH ${base}/{channelId}`, async (req, ctx, params) => {
            const target = await ownedChannel(ctx, params);
            if (!target.ok) return target.response;
            const patch = await parsePatch(req, kind, target.data.provider);
            if (!patch.ok) return patch.response;
            await updateChannelService(kind, target.data.id, patch.data);
            return NextResponse.json({data: await getOrganizationChannelSafe(kind, target.data.organizationId, target.data.id)});
        }),

        remove: handle(`DELETE ${base}/{channelId}`, async (req, ctx, params) => {
            const target = await ownedChannel(ctx, params);
            if (!target.ok) return target.response;
            const refusal = await deleteRefusal(req, kind, target.data.id, target.data.provider);
            if (refusal) return refusal;
            await deleteChannelService(kind, target.data.id);
            return new Response(null, {status: 204});
        }),

        test: handle(`POST ${base}/{channelId}/test`, async (_req, ctx, params) => {
            const target = await ownedChannel(ctx, params);
            if (!target.ok) return target.response;
            return NextResponse.json({
                data: await testStoredChannelService(kind, target.data.id, target.data.organizationId),
            });
        }),
    };
}
