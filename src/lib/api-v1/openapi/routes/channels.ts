import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "@/lib/api-v1/openapi/registry";
import type { ChannelKind } from "@/features/channel/services/channel.service";
import {
  ChannelItemSchema,
  dataResponse,
  errorResponses,
  GlobalChannelItemSchema,
} from "@/lib/api-v1/openapi/responses";
import { ChannelPatchSchema, formSchemaFor, OrganizationIdsSchema } from "@/lib/api-v1/validation/channel";

const UuidParam = z.uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" });

const security = [{ apiKeyAuth: [] }];
const tags = ["Channels"];

const WRITE_ONLY = "Credentials in config are stored and never returned by the API.";

function json(schema: z.ZodType) {
  return { required: true, content: { "application/json": { schema } } };
}

function deleteDescription(kind: ChannelKind) {
  return kind === "storage"
    ? "Deletes the channel with its storage policies. Local storage channels can't be deleted (409). If backup copies are recorded on the channel, the request is refused (409) unless force=true: deleting removes those records from Portabase; the files stay in the storage."
    : "Deletes the channel with its alert policies.";
}

function testDescription(kind: ChannelKind) {
  return kind === "storage"
    ? "Checks that Portabase can reach the stored channel. Returns success and a message with credentials masked."
    : "Sends a real test notification through the stored channel. Returns success and a message with credentials masked.";
}

export function registerChannelRoutes(registry: OpenAPIRegistry) {
  registry.register("ChannelItem", ChannelItemSchema);
  registry.register("GlobalChannelItem", GlobalChannelItemSchema);

  for (const kind of ["storage", "notification"] as const) {
    const segment = `${kind}-channels`;
    const label = `${kind} channel`;
    const createBody = json(formSchemaFor(kind));
    const conflict: Record<number, string> =
      kind === "storage" ? { 409: "Local storage channel, or recorded backup copies without force=true" } : {};
    const forceQuery = kind === "storage" ? z.object({ force: z.enum(["true", "false"]).optional() }) : undefined;

    registry.registerPath({
      method: "get",
      path: `/${segment}`,
      tags,
      summary: `List global ${label}s (instance administrators)`,
      security,
      responses: {
        200: dataResponse(`Global ${label}s`, z.array(GlobalChannelItemSchema)),
        ...errorResponses({ 403: "Not an instance administrator" }),
      },
    });

    registry.registerPath({
      method: "post",
      path: `/${segment}`,
      tags,
      summary: `Create a global ${label} (instance administrators)`,
      description: `${WRITE_ONLY} Assign it to organizations with PUT /${segment}/{channelId}/organizations.`,
      security,
      request: { body: createBody },
      responses: {
        201: dataResponse(`Created ${label}`, GlobalChannelItemSchema),
        ...errorResponses({ 403: "Not an instance administrator", 422: "Invalid request body" }),
      },
    });

    registry.registerPath({
      method: "get",
      path: `/${segment}/{channelId}`,
      tags,
      summary: `Get a global ${label} (instance administrators)`,
      security,
      request: { params: z.object({ channelId: UuidParam }) },
      responses: {
        200: dataResponse(`Global ${label}`, GlobalChannelItemSchema),
        ...errorResponses({ 403: "Not an instance administrator", 404: "Global channel not found" }),
      },
    });

    registry.registerPath({
      method: "patch",
      path: `/${segment}/{channelId}`,
      tags,
      summary: `Update a global ${label} (instance administrators)`,
      description: `Omitted fields are kept. config, when given, replaces the whole stored config and is validated against the channel's provider; the provider can't change. ${WRITE_ONLY}`,
      security,
      request: { params: z.object({ channelId: UuidParam }), body: json(ChannelPatchSchema) },
      responses: {
        200: dataResponse(`Updated ${label}`, GlobalChannelItemSchema),
        ...errorResponses({ 403: "Not an instance administrator", 404: "Global channel not found", 422: "Invalid request body or config" }),
      },
    });

    registry.registerPath({
      method: "delete",
      path: `/${segment}/{channelId}`,
      tags,
      summary: `Delete a global ${label} (instance administrators)`,
      description: deleteDescription(kind),
      security,
      request: { params: z.object({ channelId: UuidParam }), ...(forceQuery ? { query: forceQuery } : {}) },
      responses: {
        204: { description: "Channel deleted" },
        ...errorResponses({
          403: "Not an instance administrator",
          404: "Global channel not found",
          ...conflict,
        }),
      },
    });

    registry.registerPath({
      method: "post",
      path: `/${segment}/{channelId}/test`,
      tags,
      summary: `Test a global ${label} (instance administrators)`,
      description: testDescription(kind),
      security,
      request: { params: z.object({ channelId: UuidParam }) },
      responses: {
        200: dataResponse("Test result", z.object({ success: z.boolean(), message: z.string() })),
        ...errorResponses({ 403: "Not an instance administrator", 404: "Global channel not found" }),
      },
    });

    registry.registerPath({
      method: "put",
      path: `/${segment}/{channelId}/organizations`,
      tags,
      summary: `Set the organizations allowed to use a global ${label} (instance administrators)`,
      description: "Replaces the list. Removing an organization keeps that organization's policies that already use the channel.",
      security,
      request: { params: z.object({ channelId: UuidParam }), body: json(OrganizationIdsSchema) },
      responses: {
        200: dataResponse("Organizations allowed to use the channel", z.object({ organizationIds: z.array(z.uuid()) })),
        ...errorResponses({ 403: "Not an instance administrator", 404: "Global channel not found", 422: "Invalid body or unknown organization" }),
      },
    });

    const orgParams = z.object({ id: UuidParam });
    const orgChannelParams = z.object({ id: UuidParam, channelId: UuidParam });
    const orgErrors = { 403: "Missing owner/admin rights in the organization", 404: "Organization not found" };
    const sharedRefusal = "Global channel assigned to the organization (managed by an instance administrator)";

    registry.registerPath({
      method: "get",
      path: `/organizations/{id}/${segment}`,
      tags,
      summary: `List the ${label}s an organization can use`,
      description: "The organization's own channels and the global channels assigned to it (owned: false).",
      security,
      request: { params: orgParams },
      responses: {
        200: dataResponse(`${label}s`, z.array(ChannelItemSchema)),
        ...errorResponses(orgErrors),
      },
    });

    registry.registerPath({
      method: "post",
      path: `/organizations/{id}/${segment}`,
      tags,
      summary: `Create a ${label} owned by an organization`,
      description: WRITE_ONLY,
      security,
      request: { params: orgParams, body: createBody },
      responses: {
        201: dataResponse(`Created ${label}`, ChannelItemSchema),
        ...errorResponses({ ...orgErrors, 422: "Invalid request body" }),
      },
    });

    registry.registerPath({
      method: "get",
      path: `/organizations/{id}/${segment}/{channelId}`,
      tags,
      summary: `Get a ${label} the organization can use`,
      security,
      request: { params: orgChannelParams },
      responses: {
        200: dataResponse(label, ChannelItemSchema),
        ...errorResponses({ ...orgErrors, 404: "Organization or channel not found" }),
      },
    });

    registry.registerPath({
      method: "patch",
      path: `/organizations/{id}/${segment}/{channelId}`,
      tags,
      summary: `Update a ${label} owned by the organization`,
      description: `Omitted fields are kept. config, when given, replaces the whole stored config and is validated against the channel's provider; the provider can't change. ${WRITE_ONLY}`,
      security,
      request: { params: orgChannelParams, body: json(ChannelPatchSchema) },
      responses: {
        200: dataResponse(`Updated ${label}`, ChannelItemSchema),
        ...errorResponses({ 403: sharedRefusal, 404: "Organization or channel not found", 422: "Invalid request body or config" }),
      },
    });

    registry.registerPath({
      method: "delete",
      path: `/organizations/{id}/${segment}/{channelId}`,
      tags,
      summary: `Delete a ${label} owned by the organization`,
      description: deleteDescription(kind),
      security,
      request: { params: orgChannelParams, ...(forceQuery ? { query: forceQuery } : {}) },
      responses: {
        204: { description: "Channel deleted" },
        ...errorResponses({
          403: sharedRefusal,
          404: "Organization or channel not found",
          ...conflict,
        }),
      },
    });

    registry.registerPath({
      method: "post",
      path: `/organizations/{id}/${segment}/{channelId}/test`,
      tags,
      summary: `Test a ${label} owned by the organization`,
      description: testDescription(kind),
      security,
      request: { params: orgChannelParams },
      responses: {
        200: dataResponse("Test result", z.object({ success: z.boolean(), message: z.string() })),
        ...errorResponses({ 403: sharedRefusal, 404: "Organization or channel not found" }),
      },
    });
  }
}
