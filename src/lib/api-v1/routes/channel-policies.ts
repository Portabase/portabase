import {eq} from "drizzle-orm";
import {NextResponse} from "next/server";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import type {ChannelKind} from "@/features/channel/services/channel.service";
import {listOrganizationChannelsSafe} from "@/features/channel/services/channel.service";
import type {PolicyScope} from "@/features/database/schemas/policy-scope.schema";
import {
    listAlertPoliciesService,
    listStoragePoliciesService,
    replaceAlertPoliciesService,
    replaceStoragePoliciesService,
} from "@/features/database/services/channel-policy.service";
import {handle, jsonError, type Params} from "@/lib/api-v1/routes/channels";
import {requireDatabaseAccess} from "@/lib/api-v1/services/databases";
import {requireOrg} from "@/lib/api-v1/services/organizations";
import {requireProjectAccess} from "@/lib/api-v1/services/projects";
import type {ApiKeyContext} from "@/lib/api-v1/types";
import {AlertPoliciesBodySchema, StoragePoliciesBodySchema} from "@/lib/api-v1/validation/channel-policy";
import {firstDuplicate} from "@/lib/api-v1/validation/channel-utils";
import {parseJsonBody} from "@/lib/api-v1/validation/json-body";

type ScopeType = PolicyScope["type"];
type ResolvedScope = { ok: true; scope: PolicyScope; organizationId: string } | { ok: false; response: Response };

async function resolveScope(ctx: ApiKeyContext, params: Params, type: ScopeType): Promise<ResolvedScope> {
    if (type === "database") {
        const guard = await requireDatabaseAccess(params, ctx.user);
        if (!guard.ok) return guard;
        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.id, guard.data.id),
            columns: {id: true},
            with: {project: {columns: {organizationId: true}}},
        });
        if (!database?.project) return {ok: false, response: jsonError("Database is not linked to any project", 403)};
        return {ok: true, scope: {type, id: database.id}, organizationId: database.project.organizationId};
    }
    const guard = await requireProjectAccess(ctx, params?.id);
    if (!guard.ok) return guard;
    const org = await requireOrg(ctx, guard.data.project.organizationId, "canManageSettings");
    if (!org.ok) return org;
    return {ok: true, scope: {type, id: guard.data.project.id}, organizationId: guard.data.project.organizationId};
}

async function unavailableChannel(kind: ChannelKind, organizationId: string, ids: string[]): Promise<string | null> {
    if (ids.length === 0) return null;
    const usable = new Set((await listOrganizationChannelsSafe(kind, organizationId)).map((channel) => channel.id));
    return ids.find((id) => !usable.has(id)) ?? null;
}

export function channelPolicyRoutes(kind: ChannelKind, type: ScopeType) {
    const route = `/${type}s/{id}/${kind === "storage" ? "storage" : "alert"}-policy`;

    return {
        get: handle(`GET ${route}`, async (_req, ctx, params) => {
            const resolved = await resolveScope(ctx, params, type);
            if (!resolved.ok) return resolved.response;
            const data = kind === "storage"
                ? await listStoragePoliciesService(resolved.scope)
                : await listAlertPoliciesService(resolved.scope);
            return NextResponse.json({data});
        }),

        put: handle(`PUT ${route}`, async (req, ctx, params) => {
            const resolved = await resolveScope(ctx, params, type);
            if (!resolved.ok) return resolved.response;

            if (kind === "storage") {
                const body = await parseJsonBody(req, StoragePoliciesBodySchema);
                if (!body.ok) return body.response;
                const ids = body.data.policies.map((policy) => policy.storageChannelId);
                const refusal = await checkChannels(kind, resolved.organizationId, ids);
                if (refusal) return refusal;
                return NextResponse.json({data: await replaceStoragePoliciesService(resolved.scope, body.data.policies)});
            }

            const body = await parseJsonBody(req, AlertPoliciesBodySchema);
            if (!body.ok) return body.response;
            const ids = body.data.policies.map((policy) => policy.notificationChannelId);
            const refusal = await checkChannels(kind, resolved.organizationId, ids);
            if (refusal) return refusal;
            return NextResponse.json({data: await replaceAlertPoliciesService(resolved.scope, body.data.policies)});
        }),
    };
}

async function checkChannels(kind: ChannelKind, organizationId: string, ids: string[]): Promise<Response | null> {
    const duplicate = firstDuplicate(ids);
    if (duplicate) return jsonError(`Duplicate channel: ${duplicate}`, 422);
    const unavailable = await unavailableChannel(kind, organizationId, ids);
    if (unavailable) return jsonError(`Channel not available to this organization: ${unavailable}`, 422);
    return null;
}
