import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { providerKindEnum } from "@/db/schema/09_notification-channel";
import { providerStorageKindEnum } from "@/db/schema/12_storage-channel";
import { apiV1Fetch } from "@/lib/mcp/http-client";
import { err, ok } from "@/lib/mcp/tools/response";

const organizationId = z
  .string()
  .optional()
  .describe("Organization ID for a channel owned by or assigned to that organization; omit for a global channel (instance administrators)");
const channelId = z.string().describe("Channel ID");
const config = z
  .record(z.string(), z.unknown())
  .describe("Provider settings, validated by the API. Credentials are stored and never returned");

export function registerChannelTools(server: McpServer, apiKey: string) {
  async function call(path: string, method: string, body?: unknown) {
    const result = await apiV1Fetch(
      path,
      { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
      apiKey,
    );
    return result.ok ? ok(result.data) : err(result.error);
  }

  for (const kind of ["storage", "notification"] as const) {
    const segment = `${kind}-channels`;
    const base = (org?: string) => (org ? `/api/v1/organizations/${org}/${segment}` : `/api/v1/${segment}`);
    const providers = kind === "storage" ? providerStorageKindEnum.enumValues : providerKindEnum.enumValues;
    const policies = kind === "storage" ? "storage policies" : "alert policies";

    server.tool(
      `list_${kind}_channels`,
      `List ${kind} channels. With organizationId: the organization's own channels and the global ones assigned to it (owned: false). Without: global channels with their organizationIds (instance administrators). Credentials are never returned.`,
      { organizationId },
      async ({ organizationId: org }) => call(base(org), "GET"),
    );

    server.tool(
      `get_${kind}_channel`,
      `Get one ${kind} channel (without credentials)`,
      { organizationId, channelId },
      async ({ organizationId: org, channelId: id }) => call(`${base(org)}/${id}`, "GET"),
    );

    server.tool(
      `create_${kind}_channel`,
      `Create a ${kind} channel: owned by an organization when organizationId is given, otherwise global (instance administrators; assign it with set_${kind}_channel_organizations). Credentials in config are stored and never returned.`,
      {
        organizationId,
        name: z.string().describe("Channel name, 5 to 40 characters"),
        provider: z.enum(providers).describe("Provider"),
        enabled: z.boolean().optional().describe("Defaults to true"),
        config,
      },
      async ({ organizationId: org, ...body }) => call(base(org), "POST", body),
    );

    server.tool(
      `update_${kind}_channel`,
      `Update a ${kind} channel. Omitted fields are kept; config, when given, replaces the whole stored config (send every field, secrets included). The provider can't change. Global channels assigned to an organization can only be changed without organizationId by an instance administrator.`,
      {
        organizationId,
        channelId,
        name: z.string().optional().describe("New name, 5 to 40 characters"),
        enabled: z.boolean().optional().describe("Enable or disable the channel"),
        config: config.optional(),
      },
      async ({ organizationId: org, channelId: id, ...body }) => call(`${base(org)}/${id}`, "PATCH", body),
    );

    server.tool(
      `delete_${kind}_channel`,
      kind === "storage"
        ? "Permanently delete a storage channel and its storage policies. Local storage channels can't be deleted. If backup copies are recorded on the channel, the call is refused unless force is true: forcing removes those records from Portabase (the files stay in the storage)."
        : "Permanently delete a notification channel and its alert policies.",
      {
        organizationId,
        channelId,
        ...(kind === "storage"
          ? { force: z.boolean().optional().describe("Also delete when backup copies are recorded on the channel") }
          : {}),
      },
      async ({ organizationId: org, channelId: id, ...rest }) => {
        const force = (rest as { force?: boolean }).force ? "?force=true" : "";
        return call(`${base(org)}/${id}${force}`, "DELETE");
      },
    );

    server.tool(
      `test_${kind}_channel`,
      kind === "storage"
        ? "Check that Portabase can reach a stored storage channel. Returns success and a message with credentials masked."
        : "Send a real test notification through a stored notification channel. Returns success and a message with credentials masked.",
      { organizationId, channelId },
      async ({ organizationId: org, channelId: id }) => call(`${base(org)}/${id}/test`, "POST"),
    );

    server.tool(
      `set_${kind}_channel_organizations`,
      `Set which organizations may use a global ${kind} channel (instance administrators). Replaces the list; removing an organization keeps its ${policies} that already use the channel.`,
      {
        channelId,
        organizationIds: z.array(z.string()).describe("Organization IDs; an empty list removes every assignment"),
      },
      async ({ channelId: id, organizationIds }) =>
        call(`/api/v1/${segment}/${id}/organizations`, "PUT", { organizationIds }),
    );
  }

  const storageItem = z.object({
    storageChannelId: z.string().describe("Storage channel ID usable by the organization"),
    enabled: z.boolean().optional().describe("Defaults to true"),
  });
  const alertItem = z.object({
    notificationChannelId: z.string().describe("Notification channel ID usable by the organization"),
    eventKinds: z
      .array(z.string())
      .describe("Events: error_backup, success_backup, error_health_database, error_backup_missing, success_backup_recovered, error_restore, success_restore"),
    enabled: z.boolean().optional().describe("Defaults to true"),
  });

  for (const scope of ["database", "project"] as const) {
    const inherit = scope === "database" ? " An empty list makes the database use its project's policies." : "";
    for (const kind of ["storage", "alert"] as const) {
      const path = (id: string) => `/api/v1/${scope}s/${id}/${kind}-policy`;
      const fallback = kind === "storage" ? " With no enabled storage policy left, backups go to the instance's default storage." : "";

      server.tool(
        `get_${scope}_${kind}_policies`,
        `List the ${scope}'s own ${kind} policies.${inherit}`,
        { id: z.string().describe(`${scope === "database" ? "Database" : "Project"} ID`) },
        async ({ id }) => call(path(id), "GET"),
      );

      server.tool(
        `set_${scope}_${kind}_policies`,
        `Replace all ${kind} policies of a ${scope} with the given list. To add or remove one channel, call get_${scope}_${kind}_policies first and send the edited list.${inherit}${fallback}`,
        {
          id: z.string().describe(`${scope === "database" ? "Database" : "Project"} ID`),
          policies: z.array(kind === "storage" ? storageItem : alertItem).describe("The complete list of policies"),
        },
        async ({ id, policies }) => call(path(id), "PUT", { policies }),
      );
    }
  }
}
